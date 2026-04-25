<?php

$config = require __DIR__ . '/config.php';
$configured = (string) ($config['FRONTEND_ORIGIN'] ?? '*');
$allowedOrigins = array_values(array_filter(array_map('trim', explode(',', $configured))));
$requestOrigin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');

$allowOrigin = '*';
if (!in_array('*', $allowedOrigins, true)) {
    if ($requestOrigin !== '' && in_array($requestOrigin, $allowedOrigins, true)) {
        $allowOrigin = $requestOrigin;
    } else {
        $allowOrigin = $allowedOrigins[0] ?? '*';
    }
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . $allowOrigin);
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');

if ($allowOrigin !== '*') {
    header('Vary: Origin');
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}
