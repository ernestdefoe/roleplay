<?php

/*
 * Role-Play for Flarum 2 — play a character, post in-character, and run a
 * card-based tactical game inside discussions. MIT licensed. Companion tables
 * only; no core tables touched.
 */

use Ernestdefoe\Roleplay\Api;
use Flarum\Extend;

return [
    (new Extend\Frontend('forum'))
        ->js(__DIR__ . '/js/dist/forum.js')
        ->css(__DIR__ . '/less/forum.less')
        ->route('/characters', 'rp.characters'),

    (new Extend\Frontend('admin'))
        ->js(__DIR__ . '/js/dist/admin.js'),

    new Extend\Locales(__DIR__ . '/resources/locale'),

    (new Extend\Routes('api'))
        ->get('/rp/characters', 'rp.characters.list', Api\ListCharactersController::class)
        ->post('/rp/characters', 'rp.characters.create', Api\SaveCharacterController::class)
        ->patch('/rp/characters/{id}', 'rp.characters.update', Api\SaveCharacterController::class)
        ->delete('/rp/characters/{id}', 'rp.characters.delete', Api\DeleteCharacterController::class),
];
