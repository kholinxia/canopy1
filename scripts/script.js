/*
   Canopy script.js
   COS10005 Web Development, Assignment 2
   Lincoln Kho Jia Heng, 105808759

   The basic requirements live in this file:
     1. Enquire buttons: click one and the plant name is saved in
        sessionStorage, then enquiry.html picks it up and fills in Subject.
     2. Same page transfer: change the Plant drop down on enquiry.html and
        Subject changes with it.
     3. Validation, all in JavaScript (enquiry.html and contribute.html).
        I wanted every mistake in ONE message, not one alert per field.
     4. The Plant drop down and the Explore menu are built from arrays.

   The extra stuff is in enhancements.js. Load this file first, because
   that one reuses the Canopy object I make below.
*/

"use strict";

/*
 Everything the other file needs goes on this one object, so I'm not
   leaving loose variables all over the place
*/
var Canopy = {};

/* Data (arrays) */

/* The plants for the drop down on enquiry.html */
Canopy.plants = [
    { name: "Dipterocarpaceae", type: "Family" },
    { name: "Burseraceae", type: "Family" },
    { name: "Dipterocarpus", type: "Genus" },
    { name: "Hopea", type: "Genus" },
    { name: "Canarium", type: "Genus" },
    { name: "Santiria", type: "Genus" },
    { name: "Dipterocarpus grandiflorus", type: "Species" },
    { name: "Dipterocarpus cornutus", type: "Species" },
    { name: "Hopea nutans", type: "Species" },
    { name: "Hopea beccariana", type: "Species" },
    { name: "Canarium odontophyllum", type: "Species" },
    { name: "Canarium decumanum", type: "Species" },
    { name: "Santiria laevigata", type: "Species" },
    { name: "Santiria apiculata", type: "Species" }
];

/* Links for the Explore menu */
Canopy.exploreMenu = [
    { label: "Families", href: "explore1.html" },
    { label: "Genera", href: "explore2.html" },
    { label: "Species", href: "explore3.html" }
];

/* The three headings (optgroups) in the plant list */
Canopy.plantGroups = [
    { type: "Family", label: "Families" },
    { type: "Genus", label: "Genera" },
    { type: "Species", label: "Species" }
];

/* Small helpers */

/* getElementById is long to type, so a shortcut */
Canopy.byId = function (id) {
    return document.getElementById(id);
};

/* Builds the text for the Subject field, e.g. "RE: Enquiry on Hopea nutans (species)" */
Canopy.makeSubject = function (name, type) {
    return "RE: Enquiry on " + name + " (" + type.toLowerCase() + ")";
};

/* 1. Data transfer between pages */

/*
 Runs when someone clicks Enquire. I only save the plant here and let the
   link carry on to enquiry.html by itself.
*/
Canopy.storeEnquiry = function (name, type) {
    sessionStorage.setItem("enquiryName", name);
    sessionStorage.setItem("enquiryType", type);
};

/* Finds every Enquire button (they all have data enquiry name) and hooks them up */
Canopy.bindEnquireButtons = function () {
    var buttons = document.querySelectorAll("[data-enquiry-name]");
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener("click", function () {
            Canopy.storeEnquiry(this.getAttribute("data-enquiry-name"),
                                this.getAttribute("data-enquiry-type"));
        });
    }
};

/*
 On enquiry.html: read the saved plant, pick it in the list, fill in Subject.
   I delete the saved values afterwards, otherwise opening the page again
   later shows an old plant and that looked like a bug.
*/
Canopy.applyStoredEnquiry = function () {
    var name = sessionStorage.getItem("enquiryName");
    var type = sessionStorage.getItem("enquiryType");
    var subject = Canopy.byId("subject");
    var plant = Canopy.byId("plant");
    if (name === null || type === null || subject === null || plant === null) {
        return;
    }
    plant.value = type + "|" + name;
    subject.value = Canopy.makeSubject(name, type);
    sessionStorage.removeItem("enquiryName");
    sessionStorage.removeItem("enquiryType");
};

/* 2. Data transfer in the same page */

/* Change the plant by hand and Subject follows */
Canopy.onPlantChange = function () {
    var plant = Canopy.byId("plant");
    var subject = Canopy.byId("subject");
    if (plant.value === "") {
        subject.value = "";
        return;
    }
    var parts = plant.value.split("|");   /* "Species|Hopea nutans" */
    subject.value = Canopy.makeSubject(parts[1], parts[0]);
};

/* 4. Drop down lists built with JavaScript */

/*
 Plant list: one optgroup per group, one option per plant, then append
   them all to the select
*/
Canopy.buildPlantList = function () {
    var select = Canopy.byId("plant");
    if (select === null) {
        return;
    }
    var first = document.createElement("option");
    first.setAttribute("value", "");
    first.appendChild(document.createTextNode("-- Please choose a plant --"));
    select.appendChild(first);

    for (var g = 0; g < Canopy.plantGroups.length; g++) {
        var group = document.createElement("optgroup");
        group.setAttribute("label", Canopy.plantGroups[g].label);
        for (var p = 0; p < Canopy.plants.length; p++) {
            if (Canopy.plants[p].type === Canopy.plantGroups[g].type) {
                var option = document.createElement("option");
                option.setAttribute("value", Canopy.plants[p].type + "|" + Canopy.plants[p].name);
                option.appendChild(document.createTextNode(Canopy.plants[p].name));
                group.appendChild(option);
            }
        }
        select.appendChild(group);
    }
};

/*
 Menu: rebuild the Explore links from the array. I clear the ones already
   in the HTML first or everything shows up twice (found that out the hard way).
*/
Canopy.buildExploreMenu = function () {
    var lists = document.querySelectorAll("nav .has-dropdown .dropdown");
    for (var n = 0; n < lists.length; n++) {
        var list = lists[n];
        while (list.firstChild) {
            list.removeChild(list.firstChild);
        }
        for (var i = 0; i < Canopy.exploreMenu.length; i++) {
            var item = document.createElement("li");
            var link = document.createElement("a");
            link.setAttribute("href", Canopy.exploreMenu[i].href);
            link.appendChild(document.createTextNode(Canopy.exploreMenu[i].label));
            item.appendChild(link);
            list.appendChild(item);
        }
    }
};

/* 3. Validation */

/* Max lengths */
Canopy.limits = { name: 25, street: 40, city: 20, phone: 10, postcode: 5 };

/* Regular expressions */
Canopy.patterns = {
    letters: /^[A-Za-z ]+$/,                                        /* letters and spaces only */
    digits: /^[0-9]+$/,                                             /* numbers only */
    email: /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$/,
    postcode: /^[0-9]{5}$/                                          /* exactly 5 digits */
};

/* Each check takes a value and gives back an error message, or "" if it's fine */
Canopy.checks = {
    required: function (value) {
        return value.trim() === "" ? "must not be empty" : "";
    },
    name: function (value) {
        if (value.trim() === "") { return "must not be empty"; }
        if (!Canopy.patterns.letters.test(value)) { return "can only have letters and spaces"; }
        if (value.length > Canopy.limits.name) { return "can be at most " + Canopy.limits.name + " characters"; }
        return "";
    },
    email: function (value) {
        if (value.trim() === "") { return "must not be empty"; }
        if (!Canopy.patterns.email.test(value)) { return "must look like name@example.com"; }
        return "";
    },
    phone: function (value) {
        if (value.trim() === "") { return "must not be empty"; }
        if (!Canopy.patterns.digits.test(value)) { return "can only have numbers (no spaces or dashes)"; }
        if (value.length > Canopy.limits.phone) { return "can be at most " + Canopy.limits.phone + " digits"; }
        return "";
    },
    street: function (value) {
        if (value.trim() === "") { return "must not be empty"; }
        if (value.length > Canopy.limits.street) { return "can be at most " + Canopy.limits.street + " characters"; }
        return "";
    },
    city: function (value) {
        if (value.trim() === "") { return "must not be empty"; }
        if (value.length > Canopy.limits.city) { return "can be at most " + Canopy.limits.city + " characters"; }
        return "";
    },
    postcode: function (value) {
        if (value.trim() === "") { return "must not be empty"; }
        if (!Canopy.patterns.postcode.test(value)) { return "must be exactly 5 digits"; }
        return "";
    },
    positiveNumber: function (value) {
        if (value.trim() === "") { return "must not be empty"; }
        if (!Canopy.patterns.digits.test(value) || parseInt(value, 10) <= 0) {
            return "must be a whole number greater than 0";
        }
        return "";
    },
    select: function (value) {
        return value === "" ? "must be chosen from the list" : "";
    },
    futureDate: function (value) {
        if (value === "") { return "must not be empty"; }
        var today = new Date();
        var todayText = today.getFullYear() + "-" +
            ("0" + (today.getMonth() + 1)).slice(-2) + "-" +
            ("0" + today.getDate()).slice(-2);
        return value < todayText ? "cannot be in the past" : "";
    }
};

/*
 Every text field: its id, the name shown in the message, and its check.
   Radio buttons, the checkbox and the file field are different, so
   Canopy.validateForm deals with those on their own.
*/
Canopy.rules = {
    "enquiry-form": [
        { id: "subject", label: "Subject", check: "required" },
        { id: "first-name", label: "First name", check: "name" },
        { id: "last-name", label: "Last name", check: "name" },
        { id: "email", label: "Email address", check: "email" },
        { id: "phone", label: "Phone number", check: "phone" },
        { id: "plant", label: "Plant", check: "select" },
        { id: "group-size", label: "Group size", check: "positiveNumber" },
        { id: "street", label: "Street address", check: "street" },
        { id: "city", label: "City / town", check: "city" },
        { id: "postcode", label: "Postcode", check: "postcode" },
        { id: "preferred-date", label: "Preferred reply date", check: "futureDate" },
        { id: "enquiry-comments", label: "Comments", check: "required" }
    ],
    "contribute-form": [
        { id: "contributor-name", label: "Your name", check: "name" },
        { id: "email", label: "Email address", check: "email" },
        { id: "phone", label: "Phone number", check: "phone" },
        { id: "street", label: "Street address", check: "street" },
        { id: "city", label: "City / town", check: "city" },
        { id: "postcode", label: "Postcode", check: "postcode" },
        { id: "plant-name", label: "Plant's name", check: "name" },
        { id: "plant-count", label: "Number of plants seen", check: "positiveNumber" },
        { id: "plant-comments", label: "Comments", check: "required" }
    ]
};

/* Checks one field. Gives back "" or a message like "First name must not be empty" */
Canopy.checkField = function (rule) {
    var field = Canopy.byId(rule.id);
    if (field === null) {
        return "";
    }
    var problem = Canopy.checks[rule.check](field.value);
    return problem === "" ? "" : rule.label + " " + problem;
};

/* Checks the whole form and gives back a list of messages (empty means all good) */
Canopy.validateForm = function (form) {
    var errors = [];
    var rules = Canopy.rules[form.id];
    for (var i = 0; i < rules.length; i++) {
        var message = Canopy.checkField(rules[i]);
        if (message !== "") {
            errors.push(message);
        }
    }

    /* the fields that aren't plain text */
    if (form.id === "enquiry-form") {
        if (form.elements["contact-method"].value === "") {
            errors.push("Contact method must be chosen (Email or Phone)");
        }
        if (!form.elements["consent"].checked) {
            errors.push("You must tick the box to agree to be contacted");
        }
    }
    if (form.id === "contribute-form") {
        if (form.elements["plant-photo"].files.length === 0) {
            errors.push("Photo(s) of the plant must be chosen");
        }
    }
    return errors;
};

/*
 Show all errors together: a list under the form (screen readers can read it
   too) and one alert
*/
Canopy.showErrors = function (errors) {
    var box = Canopy.byId("form-errors");
    while (box.firstChild) {
        box.removeChild(box.firstChild);
    }
    if (errors.length === 0) {
        return;
    }
    var title = document.createElement("p");
    title.appendChild(document.createTextNode("Please fix these " + errors.length + " problems before sending:"));
    box.appendChild(title);
    var list = document.createElement("ul");
    for (var i = 0; i < errors.length; i++) {
        var item = document.createElement("li");
        item.appendChild(document.createTextNode(errors[i]));
        list.appendChild(item);
    }
    box.appendChild(list);
    alert("Please fix these problems:\n\n- " + errors.join("\n- "));
};

/* On submit: if anything is wrong, don't let the form go */
Canopy.onSubmit = function (event) {
    var errors = Canopy.validateForm(this);
    Canopy.showErrors(errors);
    if (errors.length > 0) {
        event.preventDefault();
    }
};

/* Cancel button: wipe the error list too */
Canopy.onReset = function () {
    Canopy.showErrors([]);
};

/* Start up */

Canopy.init = function () {
    Canopy.buildExploreMenu();
    Canopy.bindEnquireButtons();

    /* these only exist on the form pages */
    var plant = Canopy.byId("plant");
    if (plant !== null) {
        Canopy.buildPlantList();
        plant.addEventListener("change", Canopy.onPlantChange);
        Canopy.applyStoredEnquiry();
    }
    var forms = ["enquiry-form", "contribute-form"];
    for (var i = 0; i < forms.length; i++) {
        var form = Canopy.byId(forms[i]);
        if (form !== null) {
            form.addEventListener("submit", Canopy.onSubmit);
            form.addEventListener("reset", Canopy.onReset);
        }
    }
};

document.addEventListener("DOMContentLoaded", Canopy.init);
