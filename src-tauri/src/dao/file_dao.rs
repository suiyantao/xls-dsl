use crate::dao::db;
use crate::dao::models::{NewFile, XlsFile};
use crate::dao::schema::file::dsl::file;
use crate::dao::schema::file::{code, created_date, id};
use diesel::associations::HasTable;
use diesel::{ExpressionMethods, QueryDsl, RunQueryDsl, SelectableHelper};

use super::schema::file::{name, xlx_template};

pub(crate) fn select() -> anyhow::Result<Vec<XlsFile>> {
    let mut connection = db::establish_db_connection();
    let result = file
        .select(XlsFile::as_select())
        .order_by(created_date.asc())
        .load(&mut connection)?;
    Ok(result)
}

pub(crate) fn insert(new_file: NewFile) -> anyhow::Result<XlsFile> {
    let mut connection = db::establish_db_connection();
    diesel::insert_into(file::table())
        .values(new_file)
        .execute(&mut connection)?;
    let row = file.order(id.desc()).first::<XlsFile>(&mut connection)?;
    Ok(row)
}

pub(crate) fn update(update_file: XlsFile) -> anyhow::Result<XlsFile> {
    let mut connection = db::establish_db_connection();
    let _ = diesel::update(file::table())
        .set(update_file.clone())
        .filter(id.eq(&update_file.id))
        .execute(&mut connection)?;
    Ok(file
        .filter(id.eq(update_file.id))
        .first::<XlsFile>(&mut connection)?)
}

pub(crate) fn update_code_by_id(id_where: i32, code_str: String) -> anyhow::Result<XlsFile> {
    let mut connection = db::establish_db_connection();
    let _ = diesel::update(file)
        .set(code.eq(&code_str))
        .filter(id.eq(&id_where))
        .execute(&mut connection)?;
    Ok(file
        .filter(id.eq(id_where))
        .first::<XlsFile>(&mut connection)?)
}

pub(crate) fn update_name_xls_by_id(
    id_where: i32,
    name_set: String,
    xls_set: String,
) -> anyhow::Result<XlsFile> {
    let mut connection = db::establish_db_connection();
    let _ = diesel::update(file)
        .set((name.eq(&name_set), xlx_template.eq(&xls_set)))
        .filter(id.eq(&id_where))
        .execute(&mut connection)?;
    Ok(file
        .filter(id.eq(id_where))
        .first::<XlsFile>(&mut connection)?)
}

pub(crate) fn remove(id_del: i32) -> anyhow::Result<usize> {
    let mut connection = db::establish_db_connection();
    let i = diesel::delete(file.filter(id.eq(&id_del))).execute(&mut connection)?;
    Ok(i)
}

pub(crate) fn get_by_id(where_id: i32) -> anyhow::Result<XlsFile> {
    let mut connection = db::establish_db_connection();
    Ok(file
        .filter(id.eq(where_id))
        .first::<XlsFile>(&mut connection)?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Local;

    #[test]
    fn select_test() {
        let vec = select().unwrap();
        println!("{:#?}", vec);
    }

    #[test]
    fn insert_test() {
        let res = insert(NewFile {
            name: "test".to_string(),
            xlx_template: "test".to_string(),
            code: "test".to_string(),
            created_date: Some(Local::now().naive_local()),
            updated_date: Some(Local::now().naive_local()),
        })
        .unwrap();
        assert_eq!(res.name, "test");
    }

    #[test]
    fn update_test() {
        let file_add = XlsFile {
            id: 3,
            name: "test".to_string(),
            xlx_template: "test".to_string(),
            code: "test".to_string(),
            created_date: Some(Local::now().naive_local()),
            updated_date: Some(Local::now().naive_local()),
        };
        let res = update(file_add.clone()).unwrap();
        assert_eq!(res, file_add)
    }
}
