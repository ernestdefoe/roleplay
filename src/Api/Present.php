<?php

namespace Ernestdefoe\Roleplay\Api;

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
}
