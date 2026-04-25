<?php

function api_json(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function api_input(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function api_json_decode_array(?string $value): array
{
    if ($value === null || trim($value) === '') {
        return [];
    }

    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : [];
}

function api_query_all(PDO $pdo, string $sql, array $params = []): array
{
    $statement = $pdo->prepare($sql);
    $statement->execute($params);
    return $statement->fetchAll();
}

function api_bearer_token(): ?string
{
    $authorization = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['Authorization'] ?? '';
    if (!preg_match('/^Bearer\s+(.*)$/i', trim($authorization), $matches)) {
        return null;
    }

    return trim($matches[1]);
}

function api_base64url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function api_base64url_decode(string $value): string
{
    $padding = strlen($value) % 4;
    if ($padding > 0) {
        $value .= str_repeat('=', 4 - $padding);
    }

    return (string) base64_decode(strtr($value, '-_', '+/'));
}

function api_jwt_secret(): string
{
    $config = require __DIR__ . '/config.php';
    return $config['JWT_SECRET'];
}

function api_jwt_encode(array $claims): string
{
    $header = ['alg' => 'HS256', 'typ' => 'JWT'];
    $payload = $claims + [
        'iat' => time(),
        'exp' => time() + 60 * 60 * 24 * 7,
    ];

    $segments = [
        api_base64url_encode((string) json_encode($header, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)),
        api_base64url_encode((string) json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)),
    ];

    $signature = hash_hmac('sha256', implode('.', $segments), api_jwt_secret(), true);
    $segments[] = api_base64url_encode($signature);

    return implode('.', $segments);
}

function api_jwt_decode(string $token): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return null;
    }

    [$headerPart, $payloadPart, $signaturePart] = $parts;
    $expectedSignature = api_base64url_encode(hash_hmac('sha256', $headerPart . '.' . $payloadPart, api_jwt_secret(), true));

    if (!hash_equals($expectedSignature, $signaturePart)) {
        return null;
    }

    $payload = json_decode(api_base64url_decode($payloadPart), true);
    if (!is_array($payload)) {
        return null;
    }

    if (isset($payload['exp']) && time() > (int) $payload['exp']) {
        return null;
    }

    return $payload;
}

function api_method_not_allowed(array $allowed): void
{
    api_json([
        'error' => 'method_not_allowed',
        'allowed' => array_values($allowed),
    ], 405);
}

function api_path_segments(string $prefix = 'api'): array
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $segments = array_values(array_filter(explode('/', trim($path, '/')), static fn ($value) => $value !== ''));

    $prefixIndex = array_search($prefix, $segments, true);
    if ($prefixIndex === false) {
        return $segments;
    }

    return array_slice($segments, $prefixIndex + 1);
}

function api_current_user(PDO $pdo): ?array
{
    $token = api_bearer_token();
    if (!$token) {
        return null;
    }

    $claims = api_jwt_decode($token);
    if (!$claims || empty($claims['userId'])) {
        return null;
    }

    $statement = $pdo->prepare(
        'SELECT id, name, email, role, is_active, vendor_id FROM users WHERE id = :id LIMIT 1'
    );
    $statement->execute(['id' => (int) $claims['userId']]);
    $user = $statement->fetch();

    if (!$user || (int) ($user['is_active'] ?? 0) !== 1) {
        return null;
    }

    return $user;
}

function api_current_admin(PDO $pdo): ?array
{
    $user = api_current_user($pdo);
    if (!$user || strtoupper((string) ($user['role'] ?? '')) !== 'ADMIN') {
        return null;
    }

    return $user;
}
