$ErrorActionPreference = 'Stop'

$envFile = Join-Path $PSScriptRoot '..\.env'
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^(.*?)=(.*)$') {
      $name = $matches[1]
      $value = $matches[2]
      [Environment]::SetEnvironmentVariable($name, $value, 'Process')
    }
  }
}

$databaseUrl = $env:DATABASE_URL
if (-not $databaseUrl) {
  throw 'DATABASE_URL is not set.'
}

$uri = [Uri]$databaseUrl
$databaseName = $uri.AbsolutePath.TrimStart('/')
$dbHost = $uri.Host
$dbPort = $uri.Port
$dbUser = $uri.UserInfo.Split(':')[0]
$dbPassword = $uri.UserInfo.Split(':')[1]

$serverConnection = "postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/postgres"
$databaseConnection = "postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${databaseName}"

$pg = (Get-Command psql -ErrorAction SilentlyContinue)
if (-not $pg) {
  throw 'psql is not installed or not on PATH.'
}

$env:PGPASSWORD = $dbPassword

$createDbSql = @"
SELECT 'CREATE DATABASE $databaseName'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$databaseName')\gexec
"@

& psql -h $dbHost -p $dbPort -U $dbUser -d postgres -v ON_ERROR_STOP=1 -c $createDbSql
& psql -h $dbHost -p $dbPort -U $dbUser -d $databaseName -v ON_ERROR_STOP=1 -f (Join-Path $PSScriptRoot '..\db\schema.sql')

$seedSql = @"
INSERT INTO users (email, name, password_hash)
VALUES ('demo@flashycardy.com', 'Demo User', 'e5ba9f227058cf543d60d3e4bc69f0e3622e6931f471535b1622a62b855ca6241f46213cbcffc80617de67c804eb213e8af50770d718b0e2d587e17db62fe994')
ON CONFLICT (email) DO NOTHING;

WITH demo_user AS (
  SELECT id FROM users WHERE email = 'demo@flashycardy.com'
),
english_spanish AS (
  INSERT INTO decks (user_id, title, description, category, is_public)
  SELECT id, 'English to Spanish', 'Learn key English words and their Spanish meanings.', 'Languages', true
  FROM demo_user
  RETURNING id
),
english_cards AS (
  SELECT id FROM english_spanish
)
INSERT INTO cards (deck_id, front, back) VALUES
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM english_spanish) AS e) AS x LIMIT 1), 'hello', 'hola'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM english_spanish) AS e) AS x LIMIT 1), 'goodbye', 'adiós'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM english_spanish) AS e) AS x LIMIT 1), 'thank you', 'gracias'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM english_spanish) AS e) AS x LIMIT 1), 'please', 'por favor'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM english_spanish) AS e) AS x LIMIT 1), 'water', 'agua'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM english_spanish) AS e) AS x LIMIT 1), 'bread', 'pan'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM english_spanish) AS e) AS x LIMIT 1), 'house', 'casa'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM english_spanish) AS e) AS x LIMIT 1), 'friend', 'amigo'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM english_spanish) AS e) AS x LIMIT 1), 'book', 'libro'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM english_spanish) AS e) AS x LIMIT 1), 'school', 'escuela'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM english_spanish) AS e) AS x LIMIT 1), 'city', 'ciudad'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM english_spanish) AS e) AS x LIMIT 1), 'cat', 'gato'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM english_spanish) AS e) AS x LIMIT 1), 'dog', 'perro'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM english_spanish) AS e) AS x LIMIT 1), 'sun', 'sol'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM english_spanish) AS e) AS x LIMIT 1), 'moon', 'luna');

WITH demo_user AS (
  SELECT id FROM users WHERE email = 'demo@flashycardy.com'
),
history_deck AS (
  INSERT INTO decks (user_id, title, description, category, is_public)
  SELECT id, 'British History Essentials', 'Questions and answers covering major British history milestones.', 'History', true
  FROM demo_user
  RETURNING id
)
INSERT INTO cards (deck_id, front, back) VALUES
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM history_deck) AS d) AS x LIMIT 1), 'Who was the first Norman king of England?', 'William the Conqueror'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM history_deck) AS d) AS x LIMIT 1), 'In which year did the Battle of Hastings take place?', '1066'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM history_deck) AS d) AS x LIMIT 1), 'What was the Magna Carta?', 'A charter limiting the king''s power in 1215'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM history_deck) AS d) AS x LIMIT 1), 'Which queen was known as the Virgin Queen?', 'Elizabeth I'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM history_deck) AS d) AS x LIMIT 1), 'What happened in 1666 that devastated London?', 'The Great Fire of London'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM history_deck) AS d) AS x LIMIT 1), 'Who was the British prime minister during most of World War II?', 'Winston Churchill'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM history_deck) AS d) AS x LIMIT 1), 'Which ship sank in 1912 on its maiden voyage?', 'The Titanic'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM history_deck) AS d) AS x LIMIT 1), 'What event began in 1939 and lasted until 1945?', 'World War II'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM history_deck) AS d) AS x LIMIT 1), 'Who was the first woman to serve as British prime minister?', 'Margaret Thatcher'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM history_deck) AS d) AS x LIMIT 1), 'Which monarch reigned during the Victorian era?', 'Queen Victoria'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM history_deck) AS d) AS x LIMIT 1), 'What was the main purpose of the Roman walls in Britain?', 'To defend the empire from invasions'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM history_deck) AS d) AS x LIMIT 1), 'Which battle was won by the English in 1415?', 'The Battle of Agincourt'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM history_deck) AS d) AS x LIMIT 1), 'What was the name of the 17th-century conflict between the Crown and Parliament?', 'The English Civil War'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM history_deck) AS d) AS x LIMIT 1), 'Which London landmark began construction in 1066?', 'Westminster Abbey'),
  ((SELECT id FROM (SELECT id FROM (SELECT id FROM history_deck) AS d) AS x LIMIT 1), 'Which year did the United Kingdom vote to leave the European Union?', '2016');
"@

& psql -h $host -p $port -U $username -d $databaseName -v ON_ERROR_STOP=1 -c $seedSql
Write-Host "Database setup complete."
