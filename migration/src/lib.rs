#![allow(elided_lifetimes_in_paths)]
#![allow(clippy::wildcard_imports)]
pub use sea_orm_migration::prelude::*;
mod m20220101_000001_users;

mod m20260117_054411_remove_password_from_users;
mod m20260117_055030_add_otp_and_otp_sent_at_to_users;
mod m20260119_181119_remove_email_verification_reset_tokens_api_keys_and_magic_links_from_users;
mod m20260119_183916_configs;
mod m20260119_185727_admins;
mod m20260121_081258_submissions;
mod m20260123_163309_vote_assignments;
mod m20260123_172521_votes;
mod m20260123_214643_scores;
mod m20260124_122842_add_show_leaderboard_to_configs;
mod m20260124_223823_add_assigned_and_created_scores_to_configs;
pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_users::Migration),
            Box::new(m20260117_054411_remove_password_from_users::Migration),
            Box::new(m20260117_055030_add_otp_and_otp_sent_at_to_users::Migration),
            Box::new(m20260119_181119_remove_email_verification_reset_tokens_api_keys_and_magic_links_from_users::Migration),
            Box::new(m20260119_183916_configs::Migration),
            Box::new(m20260119_185727_admins::Migration),
            Box::new(m20260121_081258_submissions::Migration),
            Box::new(m20260123_163309_vote_assignments::Migration),
            Box::new(m20260123_172521_votes::Migration),
            Box::new(m20260123_214643_scores::Migration),
            Box::new(m20260124_122842_add_show_leaderboard_to_configs::Migration),
            Box::new(m20260124_223823_add_assigned_and_created_scores_to_configs::Migration),
            // inject-above (do not remove this comment)
        ]
    }
}