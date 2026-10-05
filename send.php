<?php
// Обработчик формы заявки: отправляет заявку на e-mail и/или в Telegram.
declare(strict_types=1);

$config = require __DIR__ . '/config.php';
$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

function respond(bool $ok, string $error = ''): void
{
    global $wantsJson;
    if ($wantsJson) {
        http_response_code($ok ? 200 : 400);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'error' => $error], JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: ./?sent=' . ($ok ? '1' : '0') . '#form', true, 303);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'method');
}

// Honeypot: боты заполняют скрытое поле — делаем вид, что всё отправлено
if (!empty($_POST['website'])) {
    respond(true);
}

function field(string $key, int $max): string
{
    $v = trim((string)($_POST[$key] ?? ''));
    $v = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '';
    return mb_substr($v, 0, $max);
}

$name    = field('name', 100);
$contact = field('contact', 100);
$format  = field('format', 50);
$message = field('message', 2000);

if (mb_strlen($name) < 2 || mb_strlen($contact) < 2 || empty($_POST['consent'])) {
    respond(false, 'validation');
}

$text = "Новая заявка с сайта\n\n"
      . "Имя: $name\n"
      . "Контакт: $contact\n"
      . "Формат: " . ($format ?: '—') . "\n"
      . "Запрос: " . ($message ?: '—') . "\n\n"
      . 'Время: ' . date('d.m.Y H:i');

$sent = false;

// Telegram
if ($config['tg_token'] !== '' && $config['tg_chat_id'] !== '') {
    $ctx = stream_context_create(['http' => [
        'method'  => 'POST',
        'header'  => "Content-Type: application/x-www-form-urlencoded\r\n",
        'content' => http_build_query(['chat_id' => $config['tg_chat_id'], 'text' => $text]),
        'timeout' => 10,
        'ignore_errors' => true,
    ]]);
    $res = @file_get_contents('https://api.telegram.org/bot' . $config['tg_token'] . '/sendMessage', false, $ctx);
    if ($res !== false && (json_decode($res, true)['ok'] ?? false)) {
        $sent = true;
    }
}

// E-mail
if ($config['email_to'] !== '') {
    $subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта: ' . $name) . '?=';
    $headers = implode("\r\n", [
        'From: ' . $config['email_from'],
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
    ]);
    if (@mail($config['email_to'], $subject, $text, $headers)) {
        $sent = true;
    }
}

respond($sent, $sent ? '' : 'send');
