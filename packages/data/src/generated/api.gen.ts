export interface paths {
  '/auth/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /auth/me */
    get: operations['common_get__auth_me'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/login': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** POST /auth/login */
    post: operations['common_post__auth_login'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/register': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** POST /auth/register */
    post: operations['common_post__auth_register'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/logout': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** POST /auth/logout */
    post: operations['common_post__auth_logout'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/auth/password-reset': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** POST /auth/password-reset */
    post: operations['common_post__auth_password_reset'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/media': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** POST /media */
    post: operations['common_post__media'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/media/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    /** DELETE /media/{id} */
    delete: operations['common_delete__media_id_'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/articles': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /articles */
    get: operations['time_get__articles'];
    put?: never;
    /** POST /articles */
    post: operations['time_post__articles'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/articles/trending': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /articles/trending */
    get: operations['time_get__articles_trending'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/articles/{key}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /articles/{key} */
    get: operations['time_get__articles_key_'];
    put?: never;
    post?: never;
    /** DELETE /articles/{key} */
    delete: operations['time_delete__articles_key_'];
    options?: never;
    head?: never;
    /** PATCH /articles/{key} */
    patch: operations['time_patch__articles_key_'];
    trace?: never;
  };
  '/articles/{id}/related': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /articles/{id}/related */
    get: operations['time_get__articles_id_related'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/articles/{id}/favorite': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** PUT /articles/{id}/favorite */
    put: operations['time_put__articles_id_favorite'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/articles/{id}/reaction': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** PUT /articles/{id}/reaction */
    put: operations['time_put__articles_id_reaction'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/articles/{id}/comments': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /articles/{id}/comments */
    get: operations['time_get__articles_id_comments'];
    put?: never;
    /** POST /articles/{id}/comments */
    post: operations['time_post__articles_id_comments'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/comments/{id}/like': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** PUT /comments/{id}/like */
    put: operations['common_put__comments_id_like'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/rubrics': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /rubrics */
    get: operations['time_get__rubrics'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/rubrics/{key}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /rubrics/{key} */
    get: operations['time_get__rubrics_key_'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/rubrics/{id}/stats': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /rubrics/{id}/stats */
    get: operations['time_get__rubrics_id_stats'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/rubrics/{id}/authors': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /rubrics/{id}/authors */
    get: operations['time_get__rubrics_id_authors'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/rubrics/{id}/subscription': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** PUT /rubrics/{id}/subscription */
    put: operations['time_put__rubrics_id_subscription'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/me/subscriptions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /me/subscriptions */
    get: operations['time_get__me_subscriptions'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/tags/{slug}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /tags/{slug} */
    get: operations['time_get__tags_slug_'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/topics': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /topics */
    get: operations['time_get__topics'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/newsletter': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** POST /newsletter */
    post: operations['time_post__newsletter'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/submissions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** POST /submissions */
    post: operations['time_post__submissions'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/widgets/weather': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /widgets/weather */
    get: operations['time_get__widgets_weather'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/widgets/currency': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /widgets/currency */
    get: operations['time_get__widgets_currency'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/widgets/city': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /widgets/city */
    get: operations['time_get__widgets_city'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/feed': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /feed */
    get: operations['velora_get__feed'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/posts': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /posts */
    get: operations['velora_get__posts'];
    put?: never;
    /** POST /posts */
    post: operations['velora_post__posts'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/posts/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /posts/{id} */
    get: operations['velora_get__posts_id_'];
    put?: never;
    post?: never;
    /** DELETE /posts/{id} */
    delete: operations['velora_delete__posts_id_'];
    options?: never;
    head?: never;
    /** PATCH /posts/{id} */
    patch: operations['velora_patch__posts_id_'];
    trace?: never;
  };
  '/posts/{id}/like': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** PUT /posts/{id}/like */
    put: operations['velora_put__posts_id_like'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/posts/{id}/save': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** PUT /posts/{id}/save */
    put: operations['velora_put__posts_id_save'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/posts/{id}/pin': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** PUT /posts/{id}/pin */
    put: operations['velora_put__posts_id_pin'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/posts/{id}/report': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** POST /posts/{id}/report */
    post: operations['velora_post__posts_id_report'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/posts/{id}/vote': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** POST /posts/{id}/vote */
    post: operations['velora_post__posts_id_vote'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/posts/{id}/comments': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /posts/{id}/comments */
    get: operations['velora_get__posts_id_comments'];
    put?: never;
    /** POST /posts/{id}/comments */
    post: operations['velora_post__posts_id_comments'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/stories': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /stories */
    get: operations['velora_get__stories'];
    put?: never;
    /** POST /stories */
    post: operations['velora_post__stories'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/stories/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /stories/{id} */
    get: operations['velora_get__stories_id_'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/stories/{id}/view': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** POST /stories/{id}/view */
    post: operations['velora_post__stories_id_view'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/stories/{id}/like': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** PUT /stories/{id}/like */
    put: operations['velora_put__stories_id_like'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/stories/{id}/reply': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** POST /stories/{id}/reply */
    post: operations['velora_post__stories_id_reply'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/stories/{id}/viewers': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /stories/{id}/viewers */
    get: operations['velora_get__stories_id_viewers'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/users/{login}/highlights': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /users/{login}/highlights */
    get: operations['velora_get__users_login_highlights'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/notifications': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /notifications */
    get: operations['velora_get__notifications'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/notifications/unread-count': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /notifications/unread-count */
    get: operations['velora_get__notifications_unread_count'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/notifications/read': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** POST /notifications/read */
    post: operations['velora_post__notifications_read'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/users': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /users */
    get: operations['velora_get__users'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/users/suggestions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /users/suggestions */
    get: operations['velora_get__users_suggestions'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/users/top': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /users/top */
    get: operations['velora_get__users_top'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/users/{login}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /users/{login} */
    get: operations['velora_get__users_login_'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/me/profile': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    /** PATCH /me/profile */
    patch: operations['velora_patch__me_profile'];
    trace?: never;
  };
  '/users/{login}/follow': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** PUT /users/{login}/follow */
    put: operations['velora_put__users_login_follow'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/users/{login}/notify': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** PUT /users/{login}/notify */
    put: operations['velora_put__users_login_notify'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/users/{login}/followers': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /users/{login}/followers */
    get: operations['velora_get__users_login_followers'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/users/{login}/following': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /users/{login}/following */
    get: operations['velora_get__users_login_following'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/categories': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /categories */
    get: operations['velora_get__categories'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/categories/{slug}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /categories/{slug} */
    get: operations['velora_get__categories_slug_'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/categories/{id}/subscription': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** PUT /categories/{id}/subscription */
    put: operations['velora_put__categories_id_subscription'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/categories/{id}/notify': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    /** PUT /categories/{id}/notify */
    put: operations['velora_put__categories_id_notify'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/tags/trending': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /tags/trending */
    get: operations['velora_get__tags_trending'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/me/stats': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    /** GET /me/stats */
    get: operations['velora_get__me_stats'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    Id: string;
    Slug: string;
    /** Format: date-time */
    ISODateString: string;
    /** @enum {string} */
    MediaType: 'image' | 'video' | 'audio' | 'file';
    Media: {
      id: components['schemas']['Id'];
      type: components['schemas']['MediaType'];
      url: string;
      width?: number;
      height?: number;
      /** @default  */
      alt?: string;
      poster?: string;
      duration?: number;
      name?: string;
      size?: number;
      mime?: string;
    };
    /** @enum {string} */
    UserRole: 'reader' | 'author' | 'editor' | 'admin';
    User: {
      id: components['schemas']['Id'];
      name: string;
      login: string;
      avatar: components['schemas']['Media'] | null;
      cover: components['schemas']['Media'] | null;
      role: components['schemas']['UserRole'];
      occupation?: string;
      city?: string;
      link?: string;
      bio?: string;
      isVerified: boolean;
    };
    UserPreview: {
      id: components['schemas']['Id'];
      name: string;
      login: string;
      avatar: components['schemas']['Media'] | null;
      isVerified: boolean;
      occupation?: string;
    };
    /** @enum {string} */
    ApiErrorCode:
      | 'bad_request'
      | 'unauthorized'
      | 'forbidden'
      | 'not_found'
      | 'conflict'
      | 'validation'
      | 'payload_too_large'
      | 'rate_limited'
      | 'server'
      | 'network'
      | 'timeout'
      | 'aborted'
      | 'invalid_response';
    ApiErrorBody: {
      error: {
        code: components['schemas']['ApiErrorCode'];
        message: string;
        details?: unknown;
      };
    };
    AuthSession: {
      token: string;
      user: components['schemas']['User'];
    };
    LoginInput: {
      login: string;
      password: string;
    };
    RegisterInput: {
      name: string;
      login: string;
      /** Format: email */
      email: string;
      password: string;
    };
    /** Format: email */
    Email: string;
    Rubric: {
      id: components['schemas']['Id'];
      slug: components['schemas']['Slug'];
      name: string;
      icon: string;
      color: string;
      parentId: components['schemas']['Id'] | null;
      description?: string;
      subscribersCount: number;
      articlesCount?: number;
      lastArticle?: {
        slug: components['schemas']['Slug'];
        title: string;
      } | null;
    };
    RubricPreview: {
      id: components['schemas']['Id'];
      slug: components['schemas']['Slug'];
      name: string;
      icon: string;
      color: string;
    };
    RubricStats: {
      rubricId: components['schemas']['Id'];
      /** @constant */
      period: 'month';
      articles: number;
      views: number;
      comments: number;
      newSubscribers: number;
    };
    Tag: {
      id: components['schemas']['Id'];
      slug: components['schemas']['Slug'];
      name: string;
    };
    Author: {
      id: components['schemas']['Id'];
      name: string;
      login: string;
      avatar: components['schemas']['Media'] | null;
      isVerified: boolean;
      occupation?: string;
      bio?: string;
      articlesCount?: number;
    };
    ArticleBlock:
      | {
          /** @constant */
          type: 'paragraph';
          text: string;
        }
      | {
          /** @constant */
          type: 'heading';
          level: 2 | 3;
          text: string;
          anchor: string;
        }
      | {
          /** @constant */
          type: 'image';
          media: components['schemas']['Media'];
          caption?: string;
        }
      | {
          /** @constant */
          type: 'quote';
          text: string;
          cite?: string;
        }
      | {
          /** @constant */
          type: 'list';
          ordered: boolean;
          items: string[];
        }
      | {
          /** @constant */
          type: 'embed';
          /** @enum {string} */
          provider: 'youtube' | 'rutube' | 'vk' | 'telegram' | 'other';
          url: string;
          title?: string;
        }
      | {
          /** @constant */
          type: 'summary';
          items: string[];
        }
      | {
          /** @constant */
          type: 'facts';
          items: {
            value: string;
            label: string;
          }[];
        };
    /** @enum {string} */
    VideoProvider: 'youtube' | 'rutube' | 'vk' | 'mp4';
    Timecode: {
      time: number;
      label: string;
    };
    ArticleFormat:
      | {
          /** @constant */
          kind: 'standard';
        }
      | {
          /** @constant */
          kind: 'video';
          provider: components['schemas']['VideoProvider'];
          url: string;
          duration?: number;
          poster?: string;
        }
      | {
          /** @constant */
          kind: 'photoReport';
          gallery: components['schemas']['Media'][];
        }
      | {
          /** @constant */
          kind: 'podcast';
          audio: components['schemas']['Media'];
          timecodes: components['schemas']['Timecode'][];
        }
      | {
          /** @constant */
          kind: 'opinion';
          quote: string;
          author: components['schemas']['UserPreview'];
        };
    /** @enum {string} */
    ReactionType: 'useful' | 'like' | 'doubt' | 'against';
    Reactions: {
      counts: {
        [key: string]: number;
      };
      mine: components['schemas']['ReactionType'] | null;
    };
    /** @enum {string} */
    ArticleStatus: 'draft' | 'published';
    ArticleSource: {
      name: string;
      url?: string;
    };
    Article: {
      id: components['schemas']['Id'];
      slug: components['schemas']['Slug'];
      title: string;
      lead: string;
      body: components['schemas']['ArticleBlock'][];
      cover: components['schemas']['Media'] | null;
      rubric: components['schemas']['RubricPreview'];
      subrubric: components['schemas']['RubricPreview'] | null;
      tags: components['schemas']['Tag'][];
      author: components['schemas']['Author'];
      status: components['schemas']['ArticleStatus'];
      publishedAt: components['schemas']['ISODateString'];
      updatedAt: components['schemas']['ISODateString'];
      readingTimeMin: number;
      views: number;
      commentsCount: number;
      reactions: components['schemas']['Reactions'];
      format: components['schemas']['ArticleFormat'];
      isFeatured: boolean;
      /** @default false */
      isBreaking?: boolean;
      /** @default false */
      isFavorite?: boolean;
      source: components['schemas']['ArticleSource'] | null;
    };
    ArticlePreview: {
      id: components['schemas']['Id'];
      slug: components['schemas']['Slug'];
      title: string;
      lead: string;
      cover: components['schemas']['Media'] | null;
      rubric: components['schemas']['RubricPreview'];
      subrubric: components['schemas']['RubricPreview'] | null;
      tags: components['schemas']['Tag'][];
      author: components['schemas']['Author'];
      status: components['schemas']['ArticleStatus'];
      publishedAt: components['schemas']['ISODateString'];
      updatedAt: components['schemas']['ISODateString'];
      readingTimeMin: number;
      views: number;
      commentsCount: number;
      reactions: components['schemas']['Reactions'];
      format: components['schemas']['ArticleFormat'];
      isFeatured: boolean;
      /** @default false */
      isBreaking?: boolean;
      /** @default false */
      isFavorite?: boolean;
      source: components['schemas']['ArticleSource'] | null;
    };
    ArticleInput: {
      title: string;
      lead: string;
      body: components['schemas']['ArticleBlock'][];
      coverId: components['schemas']['Id'] | null;
      rubricId: components['schemas']['Id'];
      subrubricId: components['schemas']['Id'] | null;
      tags: string[];
      format: components['schemas']['ArticleFormat'];
      status: components['schemas']['ArticleStatus'];
      /** @default false */
      isFeatured?: boolean;
      /** @default null */
      source?: components['schemas']['ArticleSource'] | null;
    };
    /** @enum {string} */
    ArticleSort: 'new' | 'popular' | 'discussed';
    /** @enum {string} */
    ReadingTimeFilter: 'all' | 'short' | 'long';
    Comment: {
      id: components['schemas']['Id'];
      articleId: components['schemas']['Id'];
      parentId: components['schemas']['Id'] | null;
      author: components['schemas']['UserPreview'];
      text: string;
      createdAt: components['schemas']['ISODateString'];
      likesCount: number;
      isLiked: boolean;
      replies: components['schemas']['Comment'][];
    };
    CommentInput: {
      text: string;
      parentId: components['schemas']['Id'] | null;
    };
    /** @enum {string} */
    WeatherCondition: 'clear' | 'partly-cloudy' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog';
    WeatherDay: {
      /** Format: date */
      date: string;
      condition: components['schemas']['WeatherCondition'];
      tempMin: number;
      tempMax: number;
    };
    WeatherForecast: {
      city: string;
      updatedAt: components['schemas']['ISODateString'];
      current: {
        temp: number;
        feelsLike: number;
        condition: components['schemas']['WeatherCondition'];
        wind: number;
        windDirection: string;
        humidity: number;
        pressure: number;
        sunrise: string;
        sunset: string;
      };
      days: components['schemas']['WeatherDay'][];
    };
    CurrencyRate: {
      code: string;
      name: string;
      value: number;
      change: number;
    };
    CitySummary: {
      city: string;
      /** Format: date */
      date: string;
      items: {
        id: components['schemas']['Id'];
        icon: string;
        label: string;
        value: string;
        note?: string;
      }[];
    };
    SubscriptionState: {
      rubricId: components['schemas']['Id'];
      isSubscribed: boolean;
      subscribersCount: number;
    };
    NewsletterSubscribeResult: {
      /** @enum {string} */
      status: 'pending_confirmation' | 'already_subscribed';
      email: string;
    };
    ReaderSubmissionInput: {
      articleId: components['schemas']['Id'] | null;
      name: string;
      contact: string;
      /** @default  */
      message?: string;
      mediaIds: components['schemas']['Id'][];
      /** @constant */
      consent: true;
    };
    Category: {
      id: components['schemas']['Id'];
      slug: components['schemas']['Slug'];
      name: string;
      description?: string;
      icon: string;
      color: string;
      cover: components['schemas']['Media'] | null;
      postsCount: number;
      subscribersCount: number;
      isSubscribed: boolean;
      notify: boolean;
    };
    CategoryPreview: {
      id: components['schemas']['Id'];
      slug: components['schemas']['Slug'];
      name: string;
      icon: string;
      color: string;
    };
    Poll: {
      id: components['schemas']['Id'];
      question: string;
      options: {
        id: components['schemas']['Id'];
        text: string;
        votes: number;
      }[];
      totalVotes: number;
      votedOptionId: components['schemas']['Id'] | null;
      /** @default false */
      multiple?: boolean;
      closesAt: components['schemas']['ISODateString'] | null;
    };
    PostLocation: {
      name: string;
      lat?: number;
      lng?: number;
    };
    PostVideo: {
      /** @enum {string} */
      provider: 'youtube' | 'rutube' | 'vk' | 'mp4';
      url: string;
      poster?: string;
    };
    Post: {
      id: components['schemas']['Id'];
      author: components['schemas']['UserPreview'];
      title: string | null;
      text: string;
      photos: components['schemas']['Media'][];
      video: components['schemas']['PostVideo'] | null;
      audio: components['schemas']['Media'] | null;
      files: components['schemas']['Media'][];
      poll: components['schemas']['Poll'] | null;
      location: components['schemas']['PostLocation'] | null;
      categories: components['schemas']['CategoryPreview'][];
      likesCount: number;
      likedByPreview: components['schemas']['UserPreview'][];
      commentsCount: number;
      repostsCount: number;
      viewsCount: number;
      isLiked: boolean;
      isSaved: boolean;
      isPinned: boolean;
      createdAt: components['schemas']['ISODateString'];
      repostOf: {
        id: components['schemas']['Id'];
        author: components['schemas']['UserPreview'];
        title: string | null;
        text: string;
        photos: components['schemas']['Media'][];
        video: components['schemas']['PostVideo'] | null;
        audio: components['schemas']['Media'] | null;
        files: components['schemas']['Media'][];
        poll: components['schemas']['Poll'] | null;
        location: components['schemas']['PostLocation'] | null;
        categories: components['schemas']['CategoryPreview'][];
        likesCount: number;
        likedByPreview: components['schemas']['UserPreview'][];
        commentsCount: number;
        repostsCount: number;
        viewsCount: number;
        isLiked: boolean;
        isSaved: boolean;
        isPinned: boolean;
        createdAt: components['schemas']['ISODateString'];
      } | null;
    };
    PostInput: {
      title: string | null;
      text: string;
      photoIds: components['schemas']['Id'][];
      video: components['schemas']['PostVideo'] | null;
      fileIds: components['schemas']['Id'][];
      poll: {
        question: string;
        options: string[];
        multiple: boolean;
      } | null;
      location: components['schemas']['PostLocation'] | null;
      categoryIds: components['schemas']['Id'][];
      /** @default null */
      repostOfId?: components['schemas']['Id'] | null;
    };
    /** @enum {string} */
    FeedKind: 'all' | 'following' | 'circles';
    PostComment: {
      id: components['schemas']['Id'];
      postId: components['schemas']['Id'];
      parentId: components['schemas']['Id'] | null;
      author: components['schemas']['UserPreview'];
      text: string;
      createdAt: components['schemas']['ISODateString'];
      likesCount: number;
      isLiked: boolean;
      replies: components['schemas']['PostComment'][];
    };
    /** @enum {string} */
    CommentSort: 'popular' | 'new';
    /** @enum {string} */
    StoryFont: 'serif' | 'sans' | 'mono';
    /** @enum {string} */
    StoryAudience: 'all' | 'close';
    StoryContent:
      | {
          /** @constant */
          kind: 'photo';
          media: components['schemas']['Media'];
          caption?: string;
        }
      | {
          /** @constant */
          kind: 'text';
          text: string;
          background: string;
          font: components['schemas']['StoryFont'];
        };
    Story: {
      id: components['schemas']['Id'];
      author: components['schemas']['UserPreview'];
      content: components['schemas']['StoryContent'];
      audience: components['schemas']['StoryAudience'];
      createdAt: components['schemas']['ISODateString'];
      expiresAt: components['schemas']['ISODateString'];
      isViewed: boolean;
      isLiked: boolean;
      viewsCount: number;
      viewers?: components['schemas']['UserPreview'][];
    };
    StoryGroup: {
      author: components['schemas']['UserPreview'];
      stories: components['schemas']['Story'][];
      hasUnviewed: boolean;
    };
    StoryInput: {
      content:
        | {
            /** @constant */
            kind: 'photo';
            mediaId: components['schemas']['Id'];
            caption?: string;
          }
        | {
            /** @constant */
            kind: 'text';
            text: string;
            background: string;
            font: components['schemas']['StoryFont'];
          };
      audience: components['schemas']['StoryAudience'];
    };
    Highlight: {
      id: components['schemas']['Id'];
      title: string;
      cover: components['schemas']['Media'] | null;
      storyIds: components['schemas']['Id'][];
    };
    /** @enum {string} */
    NotificationType: 'follow' | 'like' | 'comment' | 'reply' | 'mention' | 'repost' | 'new_post';
    Notification: {
      id: components['schemas']['Id'];
      type: components['schemas']['NotificationType'];
      actor: components['schemas']['UserPreview'];
      othersCount: number;
      post: {
        id: components['schemas']['Id'];
        excerpt: string;
        thumb: string | null;
      } | null;
      commentExcerpt: string | null;
      createdAt: components['schemas']['ISODateString'];
      isRead: boolean;
    };
    Profile: {
      id: components['schemas']['Id'];
      name: string;
      login: string;
      avatar: components['schemas']['Media'] | null;
      cover: components['schemas']['Media'] | null;
      role: components['schemas']['UserRole'];
      occupation?: string;
      city?: string;
      link?: string;
      bio?: string;
      isVerified: boolean;
      followersCount: number;
      followingCount: number;
      postsCount: number;
      followedByPreview: components['schemas']['UserPreview'][];
      isFollowing: boolean;
      isFollower: boolean;
      notify: boolean;
      pinnedPostId: components['schemas']['Id'] | null;
      mainTopic?: string;
    };
    ProfileInput: {
      name: string;
      occupation?: string;
      city?: string;
      link?: '' | string;
      bio?: string;
      avatarId: components['schemas']['Id'] | null;
      coverId: components['schemas']['Id'] | null;
    };
    TopAuthor: {
      user: components['schemas']['UserPreview'];
      followersCount: number;
      mainTopic: string;
      growthPct: number;
    };
    TrendingTag: {
      tag: string;
      postsCount: number;
    };
    StatsPeriod: 7 | 30 | 90;
    /** @enum {string} */
    StatsMetric:
      | 'postViews'
      | 'likes'
      | 'comments'
      | 'reposts'
      | 'newFollowers'
      | 'profileViews'
      | 'storyViews';
    ProfileStats: {
      period: components['schemas']['StatsPeriod'];
      totals: {
        [key: string]: number;
      };
      previousTotals: {
        [key: string]: number;
      };
      series: {
        /** Format: date */
        date: string;
        values: {
          [key: string]: number;
        };
      }[];
      topPosts: {
        id: components['schemas']['Id'];
        excerpt: string;
        thumb: string | null;
        views: number;
        likes: number;
      }[];
    };
    ArticlePatch: {
      title?: string;
      lead?: string;
      body?: components['schemas']['ArticleBlock'][];
      coverId?: components['schemas']['Id'] | null;
      rubricId?: components['schemas']['Id'];
      subrubricId?: components['schemas']['Id'] | null;
      tags?: string[];
      format?: components['schemas']['ArticleFormat'];
      status?: components['schemas']['ArticleStatus'];
      /** @default false */
      isFeatured?: boolean;
      /** @default null */
      source?: components['schemas']['ArticleSource'] | null;
    };
    PostPatch: {
      title?: string | null;
      text?: string;
      photoIds?: components['schemas']['Id'][];
      video?: components['schemas']['PostVideo'] | null;
      fileIds?: components['schemas']['Id'][];
      poll?: {
        question: string;
        options: string[];
        multiple: boolean;
      } | null;
      location?: components['schemas']['PostLocation'] | null;
      categoryIds?: components['schemas']['Id'][];
      /** @default null */
      repostOfId?: components['schemas']['Id'] | null;
    };
    ArticlePage: {
      items: components['schemas']['ArticlePreview'][];
      total: number;
      page?: number;
      pageSize?: number;
      nextCursor?: string | null;
    };
    PostPage: {
      items: components['schemas']['Post'][];
      total: number;
      page?: number;
      pageSize?: number;
      nextCursor?: string | null;
    };
    ProfilePage: {
      items: components['schemas']['Profile'][];
      total: number;
      page?: number;
      pageSize?: number;
      nextCursor?: string | null;
    };
    NotificationPage: {
      items: components['schemas']['Notification'][];
      total: number;
      page?: number;
      pageSize?: number;
      nextCursor?: string | null;
    };
    BooleanInput: {
      value: boolean;
    };
    EmailInput: {
      /** Format: email */
      email: string;
    };
    LikeState: {
      likesCount: number;
      isLiked: boolean;
    };
    FollowState: {
      isFollowing: boolean;
      followersCount: number;
    };
    CategorySubscription: {
      isSubscribed: boolean;
      subscribersCount: number;
    };
    Count: {
      count: number;
    };
    Receipt: {
      id: components['schemas']['Id'];
    };
    ReactionInput: {
      type: components['schemas']['ReactionType'] | null;
    };
    ReadInput: {
      ids: components['schemas']['Id'][] | 'all';
    };
    ReplyInput: {
      text: string;
    };
    ReportInput: {
      reason: string;
    };
    VoteInput: {
      optionIds: components['schemas']['Id'][];
    };
  };
  responses: {
    /** @description Ошибка (400/401/403/404/409/413/422/429/5xx) */
    Error: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['ApiErrorBody'];
      };
    };
  };
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  common_get__auth_me: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['User'] | null;
        };
      };
      default: components['responses']['Error'];
    };
  };
  common_post__auth_login: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['LoginInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AuthSession'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  common_post__auth_register: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['RegisterInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['AuthSession'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  common_post__auth_logout: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Выполнено, тело отсутствует */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  common_post__auth_password_reset: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['EmailInput'];
      };
    };
    responses: {
      /** @description Выполнено, тело отсутствует */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  common_post__media: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'multipart/form-data': {
          /**
           * Format: binary
           * @description До 20 МБ; допустимые MIME проверяет сервер
           */
          file: string;
          type?: components['schemas']['MediaType'];
        };
      };
    };
    responses: {
      /** @description Успешный результат */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Media'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  common_delete__media_id_: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Выполнено, тело отсутствует */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  time_get__articles: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        rubric?: string;
        tag?: string;
        author?: string;
        format?: ('standard' | 'video' | 'photoReport' | 'podcast' | 'opinion')[];
        readingTime?: 'all' | 'short' | 'long';
        search?: string;
        sort?: 'new' | 'popular' | 'discussed';
        status?: 'draft' | 'published' | 'all';
        featured?: boolean;
        breaking?: boolean;
        mine?: boolean;
        favorites?: boolean;
        subscribed?: boolean;
        since?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ArticlePage'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_post__articles: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ArticleInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Article'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_get__articles_trending: {
    parameters: {
      query?: {
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ArticlePreview'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_get__articles_key_: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Article'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_delete__articles_key_: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Выполнено, тело отсутствует */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  time_patch__articles_key_: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        key: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ArticlePatch'];
      };
    };
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Article'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_get__articles_id_related: {
    parameters: {
      query?: {
        limit?: number;
      };
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ArticlePreview'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_put__articles_id_favorite: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['BooleanInput'];
      };
    };
    responses: {
      /** @description Выполнено, тело отсутствует */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  time_put__articles_id_reaction: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReactionInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Reactions'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_get__articles_id_comments: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Comment'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_post__articles_id_comments: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CommentInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Comment'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  common_put__comments_id_like: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['BooleanInput'];
      };
    };
    responses: {
      /** @description Velora: новое состояние */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['LikeState'];
        };
      };
      /** @description Time: выполнено без тела */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  time_get__rubrics: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Rubric'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_get__rubrics_key_: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        key: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Rubric'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_get__rubrics_id_stats: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['RubricStats'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_get__rubrics_id_authors: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Author'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_put__rubrics_id_subscription: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['BooleanInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['SubscriptionState'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_get__me_subscriptions: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Id'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_get__tags_slug_: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        slug: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Tag'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_get__topics: {
    parameters: {
      query?: {
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Tag'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_post__newsletter: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['EmailInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['NewsletterSubscribeResult'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_post__submissions: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReaderSubmissionInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Receipt'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_get__widgets_weather: {
    parameters: {
      query?: {
        city?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['WeatherForecast'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_get__widgets_currency: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CurrencyRate'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  time_get__widgets_city: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CitySummary'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__feed: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
        kind?: 'all' | 'following' | 'circles';
        category?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PostPage'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__posts: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
        author?: string;
        category?: string;
        tag?: string;
        search?: string;
        tab?: 'posts' | 'media' | 'reposts' | 'saved';
        sort?: 'new' | 'popular';
        period?: 'week' | 'month' | 'all';
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PostPage'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_post__posts: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PostInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Post'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__posts_id_: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Post'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_delete__posts_id_: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Выполнено, тело отсутствует */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  velora_patch__posts_id_: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['PostPatch'];
      };
    };
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Post'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_put__posts_id_like: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['BooleanInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['LikeState'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_put__posts_id_save: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['BooleanInput'];
      };
    };
    responses: {
      /** @description Выполнено, тело отсутствует */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  velora_put__posts_id_pin: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['BooleanInput'];
      };
    };
    responses: {
      /** @description Выполнено, тело отсутствует */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  velora_post__posts_id_report: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReportInput'];
      };
    };
    responses: {
      /** @description Выполнено, тело отсутствует */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  velora_post__posts_id_vote: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['VoteInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Post'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__posts_id_comments: {
    parameters: {
      query?: {
        sort?: 'new' | 'popular';
      };
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PostComment'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_post__posts_id_comments: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['CommentInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['PostComment'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__stories: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['StoryGroup'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_post__stories: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['StoryInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      201: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Story'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__stories_id_: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Story'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_post__stories_id_view: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Выполнено, тело отсутствует */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  velora_put__stories_id_like: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['BooleanInput'];
      };
    };
    responses: {
      /** @description Выполнено, тело отсутствует */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  velora_post__stories_id_reply: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReplyInput'];
      };
    };
    responses: {
      /** @description Выполнено, тело отсутствует */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__stories_id_viewers: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['UserPreview'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__users_login_highlights: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        login: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Highlight'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__notifications: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['NotificationPage'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__notifications_unread_count: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Count'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_post__notifications_read: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ReadInput'];
      };
    };
    responses: {
      /** @description Выполнено, тело отсутствует */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__users: {
    parameters: {
      query?: {
        cursor?: string;
        limit?: number;
        search?: string;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProfilePage'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__users_suggestions: {
    parameters: {
      query?: {
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Profile'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__users_top: {
    parameters: {
      query?: {
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['TopAuthor'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__users_login_: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        login: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Profile'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_patch__me_profile: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['ProfileInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Profile'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_put__users_login_follow: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        login: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['BooleanInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['FollowState'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_put__users_login_notify: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        login: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['BooleanInput'];
      };
    };
    responses: {
      /** @description Выполнено, тело отсутствует */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__users_login_followers: {
    parameters: {
      query?: {
        cursor?: string;
        search?: string;
      };
      header?: never;
      path: {
        login: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProfilePage'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__users_login_following: {
    parameters: {
      query?: {
        cursor?: string;
        search?: string;
      };
      header?: never;
      path: {
        login: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProfilePage'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__categories: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Category'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__categories_slug_: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        slug: string;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['Category'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_put__categories_id_subscription: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['BooleanInput'];
      };
    };
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['CategorySubscription'];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_put__categories_id_notify: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: string;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['BooleanInput'];
      };
    };
    responses: {
      /** @description Выполнено, тело отсутствует */
      204: {
        headers: {
          [name: string]: unknown;
        };
        content?: never;
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__tags_trending: {
    parameters: {
      query?: {
        limit?: number;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['TrendingTag'][];
        };
      };
      default: components['responses']['Error'];
    };
  };
  velora_get__me_stats: {
    parameters: {
      query?: {
        period?: 7 | 30 | 90;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description Успешный результат */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ProfileStats'];
        };
      };
      default: components['responses']['Error'];
    };
  };
}
