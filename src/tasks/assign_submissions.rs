use std::cmp::min;

use loco_rs::prelude::*;
use rand::seq::SliceRandom;
use tracing::debug;

use crate::models::{submissions, users, vote_assignments};

pub struct AssignSubmissions;
#[async_trait]
impl Task for AssignSubmissions {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "assign_submissions".to_string(),
            detail: "Assigns submissions to users so they can vote on them.".to_string(),
        }
    }
    async fn run(&self, ctx: &AppContext, _vars: &task::Vars) -> Result<()> {
        let mut all_submissions = submissions::Entity::find().all(&ctx.db).await?;
        let all_users = submissions::Entity::find()
            .inner_join(users::Entity)
            .all(&ctx.db)
            .await?;
        all_submissions.shuffle(&mut rand::rng());

        //Delete old assignments if they exist.
        vote_assignments::Entity::delete_many()
            .exec(&ctx.db)
            .await?;

        let n_submissions = all_submissions.len();

        // Handle edge case: no submissions to assign
        if n_submissions == 0 {
            tracing::info!("No submissions to assign");
            return Ok(());
        }

        // let n_users = all_submissions.iter().count();
        let k = min(6, n_submissions - 1);
        let txn = ctx.db.begin().await?;

        for (u_i, user) in all_users.iter().enumerate() {
            let mut reviews_assigned = 0;
            let mut offset = 0;
            while reviews_assigned < k {
                let target_i = (u_i + offset) % n_submissions;
                let target_submission = all_submissions[target_i].clone();
                if target_submission.user_id != user.id {
                    let new_assignment = vote_assignments::ActiveModel {
                        user_id: Set(user.user_id),
                        submission_id: Set(target_submission.id),
                        ..Default::default()
                    };
                    debug!("{:?}", new_assignment);
                    new_assignment.insert(&txn).await?;
                    reviews_assigned += 1;
                }
                offset += 1;
            }
        }
        txn.commit().await?;
        println!("Assigned submissions successfully.");
        Ok(())
    }
}
