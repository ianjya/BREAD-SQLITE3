const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const port = 4000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

app.listen(port, () =>
  console.log(`Server berjalan di http:localhost:${port}`)
);

const db = new sqlite3.Database("bread.db");

app.get("/", (req, res) => {
  console.log("URL Query String:", req.url);

  const url = req.url === "/" ? "/?page=1" : req.url;
  const page = parseInt(req.query.page || 1);

  const limit = 5;
  const offset = (page - 1) * limit;
  const searchConditions = [];
  const queryParams = [];

  if (req.query.string === "on") {
    searchConditions.push("string LIKE ?");
    queryParams.push(`%${req.query.search_string}%`);
  }

  if (req.query.integer === "on") {
    searchConditions.push("integer LIKE ?");
    queryParams.push(`%${req.query.search_integer}%`);
  }

  if (req.query.float === "on") {
    searchConditions.push("float LIKE ?");
    queryParams.push(`%${req.query.search_float}%`);
  }

  if (req.query.date === "on") {
    searchConditions.push("date LIKE ?");
    queryParams.push(`%${req.query.search_date}%`);
  }

  if (req.query.boolean === "on") {
    searchConditions.push("boolean = ?");
    queryParams.push(req.query.search_boolean);
  }

  let queryCount = "SELECT count(*) as count FROM bread";
  let query = "SELECT * FROM bread";

  if (searchConditions.length > 0) {
    queryCount += " WHERE " + searchConditions.join(" AND ");
    query += " WHERE " + searchConditions.join(" AND ");
  }

  query += ` LIMIT $1 OFFSET $2`;
  db.get(queryCount, queryParams, (err, result) => {
    if (err) {
      console.error(err);
    } else {
      const count = result.count;
      const pages = Math.ceil(count / limit);
      db.all(query, [...queryParams, limit, offset], (err, rows) => {
        if (err) {
          console.error(err);
        } else {
          res.render("index", {
            breads: rows,
            pages: pages,
            currentPage: page,
            query: req.query,
            url,
            page,
          });
        }
      });
    }
  });
});

app.get("/add", (req, res) => {
  res.render("add");
});

app.post("/add", (req, res) => {
  const { string, integer, float, date, boolean } = req.body;
  db.run(
    "INSERT INTO bread (string, integer, float, date, boolean) VALUES (?, ?, ?, ?, ?)",
    [string, integer, float, date, boolean],
    (err) => {
      if (err) {
        console.error(err);
      }
      res.redirect("/");
    }
  );
});

app.get("/edit/:id", (req, res) => {
  const id = req.params.id;
  db.get("SELECT * FROM bread WHERE id = ?", [id], (err, row) => {
    if (err) {
      console.error(err);
    } else {
      res.render("edit", { bread: row, query: req.query });
    }
  });
});

app.post("/edit/:id", (req, res) => {
  const id = req.params.id;
  const { string, integer, float, date, boolean } = req.body;
  db.run(
    "UPDATE bread SET string = ?, integer = ?, float = ?, date = ?, boolean = ? WHERE id = ?",
    [string, integer, float, date, boolean, id],
    (err) => {
      if (err) {
        console.error(err);
      }
      res.redirect("/");
    }
  );
});

app.get("/delete/:id", (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM bread WHERE id = ?", [id], (err) => {
    if (err) {
      console.error(err);
    }
    res.redirect("/");
  });
});

app.get("/filter", (req, res) => {
  res.render("filter");
});

app.post("/filter", (req, res) => {
  const { string } = req.body;
  db.all(
    "SELECT * FROM bread WHERE string LIKE ?",
    [`%${string}%`],
    (err, rows) => {
      if (err) {
        console.error(err);
      } else {
        res.render("index", { breads: rows });
      }
    }
  );
});

app.post("/filterInteger", (req, res) => {
  const { integer } = req.body;
  db.all(
    "SELECT * FROM bread WHERE integer LIKE ?",
    [`%${integer}%`],
    (err, rows) => {
      if (err) {
        console.error(err);
      } else {
        res.render("index", { breads: rows });
      }
    }
  );
});
