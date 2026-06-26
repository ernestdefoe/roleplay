<?php

namespace Ernestdefoe\Roleplay\Api;

use Ernestdefoe\Roleplay\Models\Encounter;

/**
 * Pings live viewers that an encounter changed (a card played, a turn passed, it
 * started/ended) so every open combat tracker refetches the authoritative state.
 * Wired to flarum/realtime in Phase 3c; a no-op until then (the acting client
 * still gets the fresh encounter in the action's own response).
 */
class Touch
{
    public static function encounter(Encounter $enc): void
    {
        // Phase 3c: broadcast on the public channel rp.encounter.{discussion_id}.
    }
}
