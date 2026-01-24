use loco_rs::prelude::*;

use crate::models::users;

pub struct AddUsers;
#[async_trait]
impl Task for AddUsers {
    fn task(&self) -> TaskInfo {
        TaskInfo {
            name: "add_users".to_string(),
            detail: "Adds Users to the database.".to_string(),
        }
    }
    //18 == Complete, 1 == Name, 2 == Email (start at 0)
    async fn run(&self, ctx: &AppContext, vars: &task::Vars) -> Result<()> {
        let users_data = vars.cli_arg("users");
        let email = vars.cli_arg("email");
        let name = vars.cli_arg("name");
        if let Ok(users_data) = users_data {
            let reader = csv::Reader::from_path(users_data);
            if let Ok(mut reader) = reader {
                for result in reader.records() {
                    if let Ok(record) = result {
                        if &record[18] == "Complete" {
                            let email = record[2].to_string();
                            let name = record[1].to_string();
                            let existing_user = users::Model::find_by_email(&ctx.db, &email).await;
                            if let Ok(_) = existing_user {
                                println!("The user already exists.");
                                continue;
                            }
                            let user = users::ActiveModel {
                                email: Set(email),
                                name: Set(name),
                                ..Default::default()
                            };
                            user.insert(&ctx.db).await?;
                            println!("Added user: {:?}", &record[1]);
                        }
                    } else {
                        tracing::error!("Error while reading a record from provided file.");
                    }
                }
            } else {
                panic!("Cannot create reader from the provided path.");
            }
        }
        if let (Ok(email), Ok(name)) = (email, name) {
            let existing_user = users::Model::find_by_email(&ctx.db, &email).await;
            if let Ok(_) = existing_user {
                panic!("The user already exists.");
            }
            let user = users::ActiveModel {
                email: Set(email.to_string()),
                name: Set(name.to_string()),
                ..Default::default()
            };
            user.insert(&ctx.db).await?;
            println!("Added user: {:?}", name);
        }
        println!("Task AddUsers generated");
        Ok(())
    }
}
