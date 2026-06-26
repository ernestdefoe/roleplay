import app from 'flarum/forum/app';
import { extend } from 'flarum/common/extend';
import SessionDropdown from 'flarum/forum/components/SessionDropdown';
import LinkButton from 'flarum/common/components/LinkButton';
import CharactersPage from './components/CharactersPage';
import inCharacter from './inCharacter';
import composerPicker from './composerPicker';

app.initializers.add('ernestdefoe-roleplay', () => {
  app.routes['rp.characters'] = { path: '/characters', component: CharactersPage } as any;

  // "My Characters" entry in the account dropdown.
  extend(SessionDropdown.prototype, 'items', function (items: any) {
    if (!app.session.user) return;
    items.add(
      'rp-characters',
      LinkButton.component(
        { href: app.route('rp.characters'), icon: 'fas fa-dragon' },
        app.translator.trans('ernestdefoe-roleplay.forum.my_characters')
      ),
      50
    );
  });

  inCharacter();
  composerPicker();
});
