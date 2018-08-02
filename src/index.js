#!/usr/bin/env node
'use strict';
const fs = require("fs");
const path = require("path");
var moment = require('moment');
var Table = require('cli-table');
const colors = require('colors');

const tasksFile = path.join(process.env.HOME,'.tasks');

let tasks = [];
load();
const cmd = process.argv[2];

if(cmd === "--cmplt-add") {
    //completion stuff
    const queryWord = process.argv[3];
    const query = queryWord.substring(1);

    //list projects
    const projects = getAllProjects();
    projects.forEach(p => {
        if(p.startsWith(query)) {
            console.log("+" + p);
        }
    });

    //list projects
    const tags = getAllTags();

    tags.forEach(t => {
        if(t.startsWith(query)) {
            console.log(":" + t);
        }
    });
    process.exit(0);
}

if(cmd === "--cmplt-select") {
    const tasks = getAllTasks();
    tasks.forEach(t => {
        console.log(t);
    });
    process.exit(0);
}

function getAllTasks() {
    const tasks = [];
    tasks.forEach(t => {
        tasks.push("#" + t.id + " | " + t.title);
    });
    return tasks;
}


function getAllProjects() {
    const projects = [];
    tasks.forEach(x => {
        if(!projects.some(p => p === x.project)) {
            projects.push(x.project);
        }
    });
    projects.sort();
    return projects;
}

function getAllTags() {
    const tags = [];
    tasks.forEach(x => {
        x.tags.forEach(t => {
            if(!tags.some(p => p === t)) {
                tags.push(t);
            }
        });
    });
    tags.sort();
    return tags;
}

switch (cmd) {
    case "due":
        due();
        break;
    case "a":
    case "add":
        add();
        break;
    case "start":
        start();
        break;
    case "stop":
        stop();
        break;

    case "d":
    case "done":
        done();
        break;
    case "l":
    case "list":
    default:
        list();
        break;
}

save();

//----------

function done() {
    // stop other task
    let tid = -1;
    try {
        tid = parseInt(process.argv[3]);
        if(!tasks.some(x => x.id === tid))
        {
            console.log("Task not found");
            process.exit(-1);
        }
    } catch {
        console.log("Provide task id");
        process.exit(-1);
    }

    stop();
    tasks.find(x => x.id === tid).done = true;
}

function stop() {
    tasks.forEach(x => {
        x.timeworked.forEach(y => {
            if(y.stop === -1) {
                y.stop = Date.now();
            }
        })
    });
}

function start() {
    // stop other task
    let tid = -1;
    try {
        tid = parseInt(process.argv[3]);
        if(!tasks.some(x => x.id === tid))
        {
            console.log("Task not found");
            process.exit(-1);
        }
    } catch {
        console.log("Provide task id");
        process.exit(-1);
    }

    stop();
    tasks.find(x => x.id === tid).timeworked.push({
        start: Date.now(),
        stop: -1
    });
}

function add() {

    const newTask = getNewTask();

    //parse line
    let title = "";
    for (let i = 3; i < process.argv.length; i++) {
        const arg = process.argv[i];
        if (arg.startsWith('-s')) {
            stop();
            newTask.timeworked.push({
                start: Date.now(),
                stop: -1
            });
        } else if (arg.startsWith(':')) {
            newTask.tags.push(arg.substring(1));
        } else if (arg.startsWith('+')) {
            newTask.project = arg.substring(1);
        } else {
            title = title + arg + " ";
        }
    }

    newTask.title = title.trim();
    newTask.id = tasks.length + 1;

    tasks.push(newTask);

}

function isActive(t) {
    let result = false;
    t.timeworked.forEach(w => {
        if(w.stop === -1) {
            result = true;
        }
    });

    return result;
}

function getTotalTime(task) {
    let total = 0;
    task.timeworked.forEach(w => {
        if(w.stop === -1) {
            total = total + (Date.now() - w.start);
        } else {
            total = total + (w.stop - w.start);
        }
    });

    return total;
}

function list() {
    var table = new Table({
        head: [colors.white.bold('Id'),colors.white.bold('Project'), colors.white.bold('Title'),colors.white.bold('Created'),colors.white.bold('Time worked'),colors.white.bold("Tags")],
    });
    tasks.forEach(t => {

        if(t.done) {
            return;
        }

        const te = [];

        te.push(isActive(t) ? "*" + t.id : t.id);
        te.push(colors.green(t.project));
        te.push(t.title);
        te.push(moment(t.created).format('llll'));
        te.push(moment.duration(getTotalTime(t)).locale("en").humanize());
        te.push(colors.cyan(t.tags.join(', ')));
        table.push(te);
    });
    console.log(table.toString())

}

function load() {
    if(fs.existsSync(tasksFile)) {
        tasks = JSON.parse(fs.readFileSync(tasksFile));
    } else {
        tasks.push();
    }
}

function save() {
    fs.writeFileSync(tasksFile,JSON.stringify(tasks,null,4));
}

function getNewTask() {
    return {
        id: 0,
        project: "",
        title: "",
        tags: [],
        created: Date.now(),
        due: -1,
        priority: 0,
        done:false,
        finished: -1,
        timeworked: []
    };
}

