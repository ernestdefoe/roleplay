import app from 'flarum/forum/app';
import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import { RpApi, RpEncounter, RpCombatant, RpCard, RpPlayResult } from '../api';

declare const m: import('mithril').Static;

const t = (k: string, v?: any) => app.translator.trans(`ernestdefoe-roleplay.forum.${k}`, v);

/**
 * The live combat tracker shown in a role-play discussion's sidebar: the
 * initiative order with HP bars, whose turn it is, and the controls to run the
 * fight (GM) or act on your turn (player). Backed by the /rp/encounters API.
 */
export default class CombatTracker extends Component<{ discussionId: number }> {
  loading = true;
  busy = false;
  enc: RpEncounter | null = null;
  cards: RpCard[] = [];
  log: RpPlayResult[] = [];
  add = { name: '', team: 'party' as 'party' | 'foe', hp: '10', defense: '' };
  play = { cardId: 0, targetId: 0 };

  oninit(vnode: any) {
    super.oninit(vnode);
    this.refresh(true);
    if (app.session.user) RpApi.listCards().then((c) => { this.cards = c; m.redraw(); }).catch(() => {});
  }

  get discussionId(): number {
    return this.attrs.discussionId;
  }

  refresh(initial = false) {
    if (initial) this.loading = true;
    RpApi.showEncounter(this.discussionId)
      .then((e) => { this.enc = e; this.loading = false; m.redraw(); })
      .catch(() => { this.loading = false; m.redraw(); });
  }

  act(p: Promise<any>, onEnc?: (e: RpEncounter) => void) {
    this.busy = true;
    p.then((res) => {
      this.busy = false;
      if (onEnc) onEnc(res);
      m.redraw();
    }).catch((e) => {
      this.busy = false;
      app.alerts.show({ type: 'error' }, e.message);
      m.redraw();
    });
  }

  // ── actions ──────────────────────────────────────────────────────
  start() { this.act(RpApi.encounterAction(this.enc!.id, 'start'), (e) => (this.enc = e)); }
  next() { this.act(RpApi.encounterAction(this.enc!.id, 'next'), (e) => (this.enc = e)); }
  end() { if (confirm(t('confirm_end_encounter') as any)) this.act(RpApi.encounterAction(this.enc!.id, 'end'), () => (this.enc = null)); }
  create() { this.act(RpApi.createEncounter(this.discussionId), (e) => (this.enc = e)); }
  remove(c: RpCombatant) { this.act(RpApi.removeCombatant(c.id), () => this.refresh()); }

  addCombatant() {
    if (!this.add.name.trim()) return;
    const data = { name: this.add.name.trim(), team: this.add.team, maxHp: Number(this.add.hp) || 10, defense: this.add.defense === '' ? undefined : Number(this.add.defense) };
    this.act(RpApi.addCombatant(this.enc!.id, data), () => { this.add.name = ''; this.add.defense = ''; this.refresh(); });
  }

  playCard() {
    const e = this.enc!;
    if (!this.play.cardId || !e.activeId) return;
    this.act(
      RpApi.playCard(e.id, { cardId: this.play.cardId, actorCombatantId: e.activeId, targetCombatantId: this.play.targetId || undefined }),
      (res: { result: RpPlayResult; encounter: RpEncounter }) => { this.enc = res.encounter; this.log.unshift(res.result); this.log = this.log.slice(0, 6); }
    );
  }

  // ── view ─────────────────────────────────────────────────────────
  canActNow(): boolean {
    const e = this.enc;
    if (!e || e.status !== 'active' || !e.activeId) return false;
    if (e.isGm) return true;
    const active = e.combatants.find((c) => c.id === e.activeId);
    return !!active?.character && active.character.userId === (app.session.user as any)?.id();
  }

  view() {
    if (this.loading) return m('div.RpTracker', m(LoadingIndicator, { display: 'block', size: 'small' }));

    if (!this.enc) {
      if (!app.session.user) return null;
      return m('div.RpTracker.RpTracker-empty', [
        Button.component({ className: 'Button Button--block', icon: 'fas fa-dice-d20', loading: this.busy, onclick: () => this.create() }, t('start_encounter')),
      ]);
    }

    const e = this.enc;
    return m('div.RpTracker', { 'data-status': e.status }, [
      m('div.RpTracker-head', [
        m('span.RpTracker-title', [m('i.icon.fas.fa-dragon'), ' ', e.name || t('encounter')]),
        e.status === 'active' ? m('span.RpTracker-round', t('round_n', { n: e.round })) : m('span.RpTracker-badge', t('status_' + e.status)),
      ]),

      m('ul.RpTracker-list', e.combatants.map((c) => this.combatantRow(c, e))),

      e.isGm && e.status === 'setup' ? this.setupControls() : null,
      this.canActNow() ? this.playControls(e) : null,
      e.isGm && e.status === 'active'
        ? m('div.RpTracker-gm', [
            Button.component({ className: 'Button Button--primary Button--block', loading: this.busy, icon: 'fas fa-forward-step', onclick: () => this.next() }, t('next_turn')),
            Button.component({ className: 'Button Button--block RpTracker-end', onclick: () => this.end() }, t('end_encounter')),
          ])
        : null,

      this.log.length ? m('div.RpTracker-log', this.log.map((r) => this.logRow(r))) : null,
    ]);
  }

  combatantRow(c: RpCombatant, e: RpEncounter) {
    const pct = c.maxHp > 0 ? Math.max(0, Math.round((c.hp / c.maxHp) * 100)) : 0;
    const active = e.activeId === c.id;
    const accent = c.character?.color || (c.team === 'foe' ? '#dc2626' : '#2563eb');
    return m('li.RpCombatant', { key: c.id, class: (active ? 'is-active ' : '') + (c.isDown ? 'is-down' : '') }, [
      m('span.RpCombatant-turn', active ? m('i.icon.fas.fa-caret-right') : null),
      m('span.RpCombatant-dot', { style: { background: accent } }),
      m('div.RpCombatant-main', [
        m('div.RpCombatant-top', [
          m('span.RpCombatant-name', c.name),
          e.status !== 'setup' ? m('span.RpCombatant-init', c.initiative) : null,
        ]),
        m('div.RpCombatant-hpbar', m('span.RpCombatant-hpfill', { style: { width: pct + '%', background: c.team === 'foe' ? '#dc2626' : '#16a34a' } })),
        m('div.RpCombatant-hptext', c.isDown ? t('down') : `${c.hp}/${c.maxHp} HP`),
      ]),
      e.isGm && e.status === 'setup'
        ? Button.component({ className: 'Button Button--icon Button--flat RpCombatant-rm', icon: 'fas fa-xmark', onclick: () => this.remove(c) })
        : null,
    ]);
  }

  setupControls() {
    const a = this.add;
    return m('div.RpTracker-setup', [
      m('div.RpTracker-addrow', [
        m('input.FormControl', { placeholder: t('combatant_name'), value: a.name, oninput: (ev: any) => (a.name = ev.target.value) }),
      ]),
      m('div.RpTracker-addrow', [
        m('select.FormControl', { value: a.team, onchange: (ev: any) => (a.team = ev.target.value) }, [
          m('option', { value: 'party' }, t('team_party')),
          m('option', { value: 'foe' }, t('team_foe')),
        ]),
        m('input.FormControl', { type: 'number', min: 1, placeholder: t('hp_label'), value: a.hp, oninput: (ev: any) => (a.hp = ev.target.value), title: t('hp_label') }),
        m('input.FormControl', { type: 'number', min: 0, placeholder: t('defense_label'), value: a.defense, oninput: (ev: any) => (a.defense = ev.target.value), title: t('defense_label') }),
      ]),
      Button.component({ className: 'Button Button--block', icon: 'fas fa-user-plus', disabled: !a.name.trim(), loading: this.busy, onclick: () => this.addCombatant() }, t('add_combatant')),
      Button.component({ className: 'Button Button--primary Button--block', icon: 'fas fa-flag-checkered', disabled: this.enc!.combatants.length < 1, loading: this.busy, onclick: () => this.start() }, t('start_combat')),
    ]);
  }

  playControls(e: RpEncounter) {
    const active = e.combatants.find((c) => c.id === e.activeId);
    return m('div.RpTracker-play', [
      m('div.RpTracker-playwho', t('your_move', { name: active?.name || '' })),
      m('select.FormControl', { value: this.play.cardId, onchange: (ev: any) => (this.play.cardId = Number(ev.target.value)) }, [
        m('option', { value: 0 }, t('pick_card')),
        this.cards.map((c) => m('option', { value: c.id }, c.name)),
      ]),
      m('select.FormControl', { value: this.play.targetId, onchange: (ev: any) => (this.play.targetId = Number(ev.target.value)) }, [
        m('option', { value: 0 }, t('no_target')),
        e.combatants.filter((c) => !c.isDown).map((c) => m('option', { value: c.id }, c.name)),
      ]),
      Button.component({ className: 'Button Button--primary Button--block', icon: 'fas fa-wand-sparkles', disabled: !this.play.cardId, loading: this.busy, onclick: () => this.playCard() }, t('play_card')),
    ]);
  }

  logRow(r: RpPlayResult) {
    const hit = r.hit && r.amount > 0;
    return m('div.RpLog', { class: r.crit ? 'is-crit' : '' }, [
      m('i.icon.' + (r.icon || 'fas fa-bolt')),
      m('span', [
        m('strong', r.actor),
        ' ',
        r.card,
        r.target ? ' → ' + r.target : '',
        hit ? m('span.RpLog-dmg', ` −${r.amount}`) : m('span.RpLog-miss', ' ' + t('miss')),
        r.crit ? m('span.RpLog-crit', ' ' + t('crit')) : '',
      ]),
    ]);
  }
}
