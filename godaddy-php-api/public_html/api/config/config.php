<?php

// GoDaddy Shared Hosting Configuration
// This file is read directly instead of using .htaccess SetEnv

return [
    // Database
    'DB_HOST' => 'localhost',
    'DB_PORT' => '3306',
    'DB_NAME' => 'antaraal_db',
    'DB_USER' => 'antaraal_user',
    'DB_PASS' => 'oml]7a8FNSktNZ*)',

    // Security
    'JWT_SECRET' => 'antaraal_super_secure_key_2026_!@#_random',

    // CORS
    'FRONTEND_ORIGIN' => 'https://antaraalspace.com,http://antaraalspace.com',
];
