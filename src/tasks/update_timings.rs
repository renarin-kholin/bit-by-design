use std::str::FromStr;

use chrono::{Local, TimeDelta, Timelike};
use loco_rs::prelude::*;
use sea_orm::prelude::ChronoDateTimeWithTimeZone;

use crate::models::configs;

pub struct UpdateTimings;
#[async_trait]
impl Task for UpdateTimings {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "update_timings".to_string(),
            detail: "Task generator".to_string(),
        }
    }
    /// ss = submission_start, se = submission_end, vs = voting_start, ve = voting_end, auto = autogen
    async fn run(&self, ctx: &AppContext, vars: &task::Vars) -> Result<()> {
        let submission_start = vars.cli_arg("ss");
        let submission_end = vars.cli_arg("se");
        let voting_start = vars.cli_arg("vs");
        let voting_end = vars.cli_arg("ve");
        let auto_gen = vars.cli_arg("auto");
        let period = vars.cli_arg("p"); //Period for autogen

        let config = configs::Entity::find().one(&ctx.db).await?;
        let mut config = if let Some(config) = config {
            config.into_active_model()
        } else {
            configs::ActiveModel {
                show_leaderboard: Set(false),
                ..Default::default()
            }
        };
        if let (Ok(auto_gen), Ok(period)) = (auto_gen, period) {
            if auto_gen.to_lowercase().as_str() == "true" {
                let td = TimeDelta::minutes(period.parse::<i64>().unwrap());
                let now = ChronoDateTimeWithTimeZone::from(Local::now());
                let ss = now + td;
                let se = ss + td;
                let vs = se + td;
                let ve = vs + td;
                config.submission_start = Set(Some(ss));
                config.submission_end = Set(Some(se));
                config.voting_start = Set(Some(vs));
                config.voting_end = Set(Some(ve));
            }
        } else {
            if let Ok(ss) = submission_start {
                config.submission_start = Set(Some(
                    ChronoDateTimeWithTimeZone::from_str(ss.as_str()).unwrap(),
                ));
            }
            if let Ok(se) = submission_end {
                config.submission_end = Set(Some(
                    ChronoDateTimeWithTimeZone::from_str(se.as_str()).unwrap(),
                ));
            }
            if let Ok(vs) = voting_start {
                config.voting_start = Set(Some(
                    ChronoDateTimeWithTimeZone::from_str(vs.as_str()).unwrap(),
                ));
            }
            if let Ok(ve) = voting_end {
                config.voting_end = Set(Some(
                    ChronoDateTimeWithTimeZone::from_str(ve.as_str()).unwrap(),
                ));
            }
        }
        config.save(&ctx.db).await?;
        println!("Updated competition timings.");
        Ok(())
    }
}
