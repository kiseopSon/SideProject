-- Create Keycloak database if it doesn't exist (Postgres init scripts run only on first init)
DO
$$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_database WHERE datname = 'keycloak') THEN
    CREATE DATABASE keycloak;
  END IF;
END
$$;

