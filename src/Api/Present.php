<?php

namespace Ernestdefoe\Roleplay\Api;

use Ernestdefoe\Roleplay\Models\Card;
use Ernestdefoe\Roleplay\Models\Character;

/** Shapes models into the plain JSON the forum frontend consumes. */
class Present
{
    public static function character(Character $c): array
    {
        return [
            'id' => (int) $c->id,
            'name' => $c->name,
            'slug' => $c->slug,
            'avatarUrl' => $c->avatar_url,
            'color' => $c->color,
            'bio' => $c->bio,
            'status' => $c->status,
            'postCount' => (int) $c->post_count,
        ];
    }

    public static function card(Card $c, ?int $actorId = null): array
    {
        return [
            'id' => (int) $c->id,
            'name' => $c->name,
            'icon' => $c->icon,
            'type' => $c->type,
            'description' => $c->description,
            'attackExpr' => $c->attack_expr,
            'damageExpr' => $c->damage_expr,
            'defense' => $c->defense !== null ? (int) $c->defense : null,
            'hp' => $c->hp !== null ? (int) $c->hp : null,
            'cost' => (int) $c->cost,
            'isPublic' => (bool) $c->is_public,
            // Lets the UI gate edit/delete to the owner without a second request.
            'mine' => $actorId !== null && (int) $c->user_id === $actorId,
        ];
    }
}
