<?php

$config = require __DIR__ . '/config.php';

$host = $config['DB_HOST'];
$port = $config['DB_PORT'];
$name = $config['DB_NAME'];
$user = $config['DB_USER'];
$pass = $config['DB_PASS'];

$dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $name);

try {
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (Throwable $exception) {
    api_json([
        'error' => 'database_connection_failed',
        'message' => $exception->getMessage(),
    ], 500);
}

return $pdo;
