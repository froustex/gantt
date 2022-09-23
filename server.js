const express = require ('express');
const bodyParser = require ('body-parser');
require("dotenv").config();
const path = require ('path');
const app = express();
const connection = require('./db-config');
const Promise = require("bluebird");
require('date-format-lite');
const db = connection.promise();

const PORT = process.env.PORT || 1337;

connection.connect(err => {
    if(err) console.log('erreur de connexion à la DB', err)
    else console.log('Connexion à la DB réussie, id' + connection.threadId)
})

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.json())

app.listen(PORT, (err) => {
    if(err) {
        console.log(err)
    } else {
        console.log(`Server is running on port ${PORT}`)
    }
});

//const Promise = require("bluebird");
//require('date-format-lite');

//const db = connection.promise();

    app.get("/data",(req, res) => {
        
        Promise.all([
            db.query("SELECT * FROM gantt_tasks ORDER BY sortorder ASC"),
            db.query("SELECT * FROM gantt_links")
        ]).then(results => {
            let tasks = results[0][0],
                links = results[1][0];

            for (let i = 0; i < tasks.length; i++) {
                tasks[i].start_date =  tasks[i].start_date.format("YYYY-MM-DD hh:mm:ss")
                tasks[i].open = true;
            }

            res.send({
                data: tasks,
                collections: {links: links}
            });

        }).catch(error => {
            sendResponse(res, "error", null, error);
        });
    });

    app.get("/data/:id",(req, res) => {
        const reqP1 = "select * from gantt_tasks where id  = " + req.params.id + " OR parent = " + req.params.id + " ORDER BY sortorder ASC";
        console.log(reqP1);
        Promise.all([
            db.query(reqP1),
            db.query("select * from gantt_links")
        ]).then(results => {
            let tasks = results[0][0],
                links = results[1][0];
                console.log(tasks.length);
            for (let i = 0; i < tasks.length; i++) {
                tasks[i].start_date =  tasks[i].start_date.format("YYYY-MM-DD hh:mm:ss")
                tasks[i].open = true;
            }
            res.send({
                data: tasks,
                collections: {links: links}
            });

        }).catch(error => {
            sendResponse(res, "error", null, error);
        });
    });

    app.get("/datacoco/:id",(req, res) => {
        let sid = req.params.id;
        Promise.all([
            db.query("select * from gantt_tasks where id  = ?", [sid]),
            db.query("select * from gantt_links")
        ]).then(results => {
        
            let tasks = results[0][0],
                links = results[1][0];

            for (let i = 0; i < tasks.length; i++) {
                tasks[i].start_date =  tasks[i].start_date.format("YYYY-MM-DD hh:mm:ss")
                tasks[i].open = true;
            }
            res.send({
                data: tasks,
                collections: {links: links}
            });

        }).catch(error => {
            sendResponse(res, "error", null, error);
        });
    });

    

    app.get("/dataTest",(req, res) => {       
        Promise.all([
            db.query("SELECT * FROM gantt_tasks where parent = 0 ORDER BY sortorder ASC"),
            db.query("SELECT * FROM gantt_links")
        ]).then(results => {
            let tasks = results[0][0],
                links = results[1][0];
                console.log(tasks.length);
            for (let i = 0; i < tasks.length; i++) {
                tasks[i].start_date =  tasks[i].start_date.format("YYYY-MM-DD hh:mm:ss")
                tasks[i].open = true;
            }

            res.send({
                data: tasks,
                collections: {links: links}
            });

        }).catch(error => {
            sendResponse(res, "error", null, error);
        });
        
        
    });

    app.post("/data/task", (req, res) => {
        let task = getTask(req.body);

        db.query("SELECT MAX(sortorder) AS maxOrder FROM gantt_tasks")
        .then(result => {
            let orderIndex = (result[0].maxOrder || 0) + 1;
            return db.query('INSERT INTO gantt_tasks(text, start_date, duration, progress, parent, sortorder) VALUES (?,?,?,?,?,?)', 
                [task.text, task.start_date, task.duration, task.progress, task.parent, orderIndex]);
        })
        .then(result => {
            sendResponse(res, "inserted", result.insertId);
        })
        .catch(error => {
            sendResponse(res, "error, null, error");
        });
    });

    app.put("/data/task/:id", (req, res) => {
        let sid = req.params.id,
            target = req.body.target,
            task = getTask(req.body);
            console.log(task);
            
        Promise.all([
            db.query("UPDATE gantt_tasks SET text = ?, start_date = ?, duration = ?, progress = ?, parent = ? WHERE id = ?",
                    [task.text, task.start_date, task.duration, task.progress, task.parent, sid]),
                updateOrder(sid, target)  
        ])
            .then (result => {
                sendResponse(res, "updated");
            })
            .catch(error => {
                sendResponse(res, "error", null, error);
            });
    });

   
    

    function updateOrder(taskId, target) {
        let nextTask = false;
        let targetOrder;

        target = target || "";

        /*if(target.startsWith("next:")) {
                target = target.substr("next:".length);
                nextTask = true;
        }
        console.log(target);
        return db.query("SELECT * FROM gantt_tasks WHERE id = ?",
        [target])
        .then(result => {
            if(!result[0])
                return Promise.resolve();

            targetOrder = result[0].sortorder;
            console.log(result[0]);
            if(nextTask)
                targetOrder++;

            return db.query("UPDATE gantt_tasks SET sortorder = sortorder + 1 WHERE sortorder >= ?",
                    [targetOrder])
                    .then(result => {
                        return db.query("UPDATE gantt_tasks SET sortorder = ? WHERE id = ?",
                                [targetOrder, taskId]);
                    });
        });*/
    }

    app.delete("/data/task/:id", (req, res) => {
        let sid = req.params.id;
        db.query('DELETE FROM gantt_tasks WHERE id = ?', [sid])
                .then(result => {
                    sendResponse(res, "deleted");
                })
                .catch(error => {
                    sendResponse(res, "error", null, error);
                });
    });

    app.post("/data/link", (res, req) => {
        let link = getLink(req.body);

        db.query("INSERT INTO gantt_links(source, target, type) VALUES (?, ?, ?)",
                [link.source, link.target, link.type])
                .then(result => {
                    sendResponse(res, "inserted", result.insertId);
                })
                .catch(error => {
                    sendResponse(res, "error", null, error);
                });
    });

    app.put("/data/link/:id", (req, res) => {
        let sid = req.params.id;
                link = getLink(req.body);

        db.query("UPDATE gantt_links SET source = ?, target = ?, type = ? WHERE id = ?",
                [link.source, link.target, link.type, sid])
                .then(result => {
                    sendResponse(res, "updated");
                })
                .catch(error => {
                    sendResponse(res, "error, null, error");
                });
    });

    app.delete("/data/link/:id", (req, res) => {
        let sid = req.params.id;
        db.query("DELETE FROM gantt_links WHERE id = ?",
                [sid])
                .then(result => {
                    sendResponse(res, "deleted");
                })
                .catch(error => {
                    sendResponse(res, "error", null, error);
                });
    });

    function getTask(data) {
        return {
                text: data.text,
                start_date: data.start_date.date("YYYY-MM-DD"),
                duration: data.duration,
                progress: data.progress,
                parent: data.parent
        };
    }

    function getLink(data) {
        return {
            source: data.source,
            target: data.target,
            type: data.type
        };
    }

    function sendResponse(res, action, tid, error) {

        if(action == "error")
           console.log(error);

        let result = {
            action : action
        };
        if(tid !== undefined && tid !== null)
            result.tid = tid;

        res.send(result);
    }

