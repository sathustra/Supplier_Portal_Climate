from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str
    jwt_secret: str
    frontend_url: str = "http://localhost:3000"
    admin_email: str = "admin@example.com"
    admin_password: str = "changeme"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24


settings = Settings()
