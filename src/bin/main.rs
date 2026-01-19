use bit_by_design::app::App;
use loco_rs::cli;
use migration::Migrator;
use tracing::info;

#[tokio::main]
async fn main() -> loco_rs::Result<()> {
    let loco_env = std::env::var("LOCO_ENV").unwrap_or("development".to_string());
    match loco_env.as_str() {
        "development" => {
            info!("Loading development environment variables.");
            dotenvy::from_filename(".development.env").expect("Failed to load .env file.")
        }
        "production" => {
            info!("Loading production environment variables.");
            dotenvy::from_filename(".production.env").expect("Failed to load .env file.")
        }
        _ => {
            info!("Loading default environment variables.");
            dotenvy::dotenv().expect("Failed to load .env file.")
        }
    };

    cli::main::<App, Migrator>().await
}
