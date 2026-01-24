use loco_rs::prelude::*;

use crate::models::configs;

pub struct ShowLeaderboard;
#[async_trait]
impl Task for ShowLeaderboard {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "show_leaderboard".to_string(),
            detail: "Shows the leaderboard on the frontend.".to_string(),
        }
    }
    async fn run(&self, ctx: &AppContext, vars: &task::Vars) -> Result<()> {
        let show = vars.cli_arg("show");
        let config = configs::Entity::find().one(&ctx.db).await?;
        if let Some(config) = config {
            let mut config = config.into_active_model();
            if let Ok(show) = show {
                match show.to_lowercase().as_str() {
                    "true" => {
                        config.show_leaderboard = Set(true);
                    }
                    "false" => {
                        config.show_leaderboard = Set(false);
                    }
                    _ => tracing::error!("Invalid value for show argument."),
                };
            } else {
                config.show_leaderboard = Set(true);
            }
            config.save(&ctx.db).await?;
        } else {
            tracing::error!("Configs is empty.");
        }
        println!("Show Leaderboard updated.");
        Ok(())
    }
}
