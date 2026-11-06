/* ===========================================
   Canopy - enhancements.js
   COS10005 Web Development, Assignment 2
   Lincoln Kho Jia Heng, 105808759

   The five JavaScript enhancements, each one in its own function.
   They are listed and explained on enhancement2.html.

     1. Identify a plant from a photo (Pl@ntNet API)
     2. Sending the form to an API (Web3Forms) with fetch()
     3. Preview pop-up before a form is sent
     4. Plant slideshow on the home page
     5. Search and filter on the Species page

   They are numbered from the hardest (1) to the easiest (5). The dropdown
   menu, the menu highlight, the live feedback while typing and the saved
   form draft are also in this file, but they are not counted as enhancements.

   This file needs script.js to be loaded first. It uses the Canopy
   object from there (the rules, the checks and the helpers).
   =========================================== */

"use strict";

/* ---------- Other A (not counted): dropdown menu opened with JavaScript ----------
   The Explore link has a dropdown with Families, Genera and Species. The CSS
   only describes the closed and the open look (.dropdown and .open); this code
   decides when it is open:
     - the mouse moves onto Explore: it opens (and shuts a moment after the mouse leaves)
     - the keyboard moves onto Explore or a link inside it: it opens
     - Escape, or a click anywhere else: it closes
     - touch screens have no hover, so the first tap opens it and the second tap follows the link
   aria-expanded tells screen readers whether the menu is open.
   Ideas: MDN, mouseenter event and aria-expanded
   https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseenter_event
   https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-expanded */
Canopy.makeDropdown = function (item) {
    var link = item.querySelector("a");
    var timer = null;
    var wasOpen = false;

    var open = function () {
        window.clearTimeout(timer);
        item.classList.add("open");
        link.setAttribute("aria-expanded", "true");
    };
    var close = function () {
        item.classList.remove("open");
        link.setAttribute("aria-expanded", "false");
    };

    link.setAttribute("aria-haspopup", "true");
    link.setAttribute("aria-expanded", "false");

    item.addEventListener("mouseenter", open);
    item.addEventListener("mouseleave", function () {
        /* a short wait so the menu does not snap shut if the mouse slips off */
        timer = window.setTimeout(close, 250);
    });

    item.addEventListener("focusin", open);
    item.addEventListener("focusout", function (event) {
        if (!item.contains(event.relatedTarget)) {
            close();
        }
    });
    item.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            close();
            link.focus();
        }
    });

    /* remember if the menu was already open before this press, because the
       press itself opens it (touch screens fire hover events on a tap) */
    link.addEventListener("pointerdown", function () {
        wasOpen = item.classList.contains("open");
    });
    link.addEventListener("click", function (event) {
        if (window.matchMedia("(hover: none)").matches && !wasOpen) {
            event.preventDefault();
            open();
        }
    });

    document.addEventListener("click", function (event) {
        if (!item.contains(event.target)) {
            close();
        }
    });
};

Canopy.setupDropdown = function () {
    var items = document.querySelectorAll("nav .has-dropdown");
    for (var i = 0; i < items.length; i++) {
        Canopy.makeDropdown(items[i]);
    }
};

/* ---------- Other B (not counted): highlight the current page in the menu ----------
   Reads the file name from the address (for example "enquiry.html") and gives
   the matching menu link the "active" class, which the CSS styles.
   The Families, Genera and Species pages also light up Explore.
   Idea: MDN, Location.pathname
   https://developer.mozilla.org/en-US/docs/Web/API/Location/pathname */
Canopy.highlightCurrentPage = function () {
    var file = window.location.pathname.split("/").pop();
    if (file === "") {
        file = "index.html";
    }
    /* these pages belong under the Explore menu item */
    var exploreGroup = ["explore.html", "explore1.html", "explore2.html", "explore3.html"];
    if (exploreGroup.indexOf(file) !== -1) {
        file = "explore.html";
    }
    var links = document.querySelectorAll("header nav .menu > li > a");
    for (var i = 0; i < links.length; i++) {
        if (links[i].getAttribute("href") === file) {
            links[i].classList.add("active");
            links[i].setAttribute("aria-current", "page");
        }
    }
};

/* ---------- Other C (not counted): live feedback while typing ----------
   Uses the same rules and regular expressions as the submit check in script.js,
   but shows the result next to each field straight away. A field is checked
   when you leave it, and then again on every key press.
   Idea: MDN, Regular expressions
   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions */
Canopy.getNote = function (rule) {
    var field = Canopy.byId(rule.id);
    var note = Canopy.byId(rule.id + "-note");
    if (note === null) {
        note = document.createElement("span");
        note.setAttribute("id", rule.id + "-note");
        note.setAttribute("class", "field-note");
        field.parentNode.appendChild(note);
        field.setAttribute("aria-describedby", rule.id + "-note");
    }
    return note;
};

Canopy.showFieldResult = function (rule) {
    var field = Canopy.byId(rule.id);
    var message = Canopy.checkField(rule);
    var note = Canopy.getNote(rule);
    while (note.firstChild) {
        note.removeChild(note.firstChild);
    }
    if (message === "") {
        field.classList.remove("field-bad");
        field.classList.add("field-ok");
        note.appendChild(document.createTextNode("Looks good"));
        note.setAttribute("class", "field-note field-note-ok");
    } else {
        field.classList.remove("field-ok");
        field.classList.add("field-bad");
        note.appendChild(document.createTextNode(message));
        note.setAttribute("class", "field-note field-note-bad");
    }
};

Canopy.setupLiveFeedback = function (form) {
    var rules = Canopy.rules[form.id];
    for (var i = 0; i < rules.length; i++) {
        /* the empty message boxes are made now and keep their height, so the
           form does not jump when the first message appears */
        Canopy.getNote(rules[i]);
        (function (rule) {
            var field = Canopy.byId(rule.id);
            var touched = false;
            var eventName = (field.tagName === "SELECT") ? "change" : "input";
            field.addEventListener("blur", function () {
                touched = true;
                Canopy.showFieldResult(rule);
            });
            field.addEventListener(eventName, function () {
                if (touched || field.tagName === "SELECT") {
                    Canopy.showFieldResult(rule);
                }
            });
        })(rules[i]);
    }
    /* the Cancel button clears the colours and messages as well */
    form.addEventListener("reset", function () {
        var notes = form.querySelectorAll(".field-note");
        for (var n = 0; n < notes.length; n++) {
            while (notes[n].firstChild) {
                notes[n].removeChild(notes[n].firstChild);
            }
        }
        var marked = form.querySelectorAll(".field-ok, .field-bad");
        for (var m = 0; m < marked.length; m++) {
            marked[m].classList.remove("field-ok");
            marked[m].classList.remove("field-bad");
        }
    });
};

/* ---------- Enhancement 1: identify a plant from a photo (Pl@ntNet API) ----------
   On the Contribute page, choose a photo, say what part of the plant it shows
   and press "Identify this plant". The photo is sent to the Pl@ntNet
   identification service. It answers with its best guesses and a score for each,
   and one click puts a guess into the "Plant's name" box.
   Pl@ntNet needs an API key (made on my.plantnet.org). The key goes in the web
   address, not in the body. Pl@ntNet calls it a private key; it is written here
   because the site has no server to hide it in, so it is only suitable for this
   assignment. For use in a browser, the key's settings on my.plantnet.org must have
   "expose my API key" ticked and the address of the site (for example
   http://localhost:8000) added to the allowed domains. The free plan allows 500
   identifications a day.
   Ideas: Pl@ntNet API documentation, MDN Using the Fetch API and FormData
   https://my.plantnet.org/doc/getting-started/introduction
   https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch */
Canopy.plantnetKey = "2b10vhm3qmD4oZ9owlsy2Z52vO";
Canopy.plantnetUrl = "https://my-api.plantnet.org/v2/identify/all";

/* Words for the "part of the plant" menu: [value Pl@ntNet understands, text shown] */
Canopy.organs = [["auto", "Not sure"], ["leaf", "Leaf"], ["flower", "Flower"], ["fruit", "Fruit"], ["bark", "Bark"], ["habit", "Whole tree"]];

/* Writes a message into the results box. "kind" is a class: identify-wait, identify-error or "" */
Canopy.identifyMessage = function (box, text, kind) {
    while (box.firstChild) {
        box.removeChild(box.firstChild);
    }
    var note = document.createElement("p");
    if (kind !== "") {
        note.setAttribute("class", kind);
    }
    note.appendChild(document.createTextNode(text));
    box.appendChild(note);
};

/* Shows each guess with a button that copies the name into the form */
Canopy.identifyResults = function (box, results, nameField) {
    while (box.firstChild) {
        box.removeChild(box.firstChild);
    }
    var heading = document.createElement("p");
    heading.appendChild(document.createTextNode("Best guesses from Pl@ntNet:"));
    box.appendChild(heading);

    var list = document.createElement("ul");
    var count = Math.min(results.length, 3);
    for (var i = 0; i < count; i++) {
        var name = results[i].species.scientificNameWithoutAuthor;
        var family = results[i].species.family.scientificNameWithoutAuthor;
        var common = results[i].species.commonNames;
        var percent = Math.round(results[i].score * 100);

        var item = document.createElement("li");
        var italic = document.createElement("em");
        italic.appendChild(document.createTextNode(name));
        item.appendChild(italic);
        var detail = " (" + family + (common.length > 0 ? ", " + common[0] : "") + ") " + percent + "% ";
        item.appendChild(document.createTextNode(detail));

        item.appendChild(Canopy.makeButton("Use this name", "Use " + name + " as the plant name", (function (chosen) {
            return function () {
                nameField.value = chosen;
                /* tell the other scripts (draft and live feedback) that the box changed */
                nameField.dispatchEvent(new Event("input", { bubbles: true }));
                nameField.focus();
            };
        })(name)));
        list.appendChild(item);
    }
    box.appendChild(list);
};

Canopy.setupIdentify = function (form) {
    var photo = form.elements["plant-photo"];
    var nameField = form.elements["plant-name"];
    if (photo === undefined || nameField === undefined) {
        return;
    }

    var wrapper = document.createElement("div");
    wrapper.setAttribute("class", "form-row identify-box");

    var label = document.createElement("label");
    label.setAttribute("for", "plant-organ");
    label.appendChild(document.createTextNode("What does the photo show?"));
    var menu = document.createElement("select");
    menu.setAttribute("id", "plant-organ");
    for (var i = 0; i < Canopy.organs.length; i++) {
        var option = document.createElement("option");
        option.setAttribute("value", Canopy.organs[i][0]);
        option.appendChild(document.createTextNode(Canopy.organs[i][1]));
        menu.appendChild(option);
    }

    var results = document.createElement("div");
    results.setAttribute("role", "status");

    var button = Canopy.makeButton("Identify this plant", "", function () {
        if (photo.files.length === 0) {
            Canopy.identifyMessage(results, "Choose a photo above first.", "identify-error");
            return;
        }
        /* Pl@ntNet accepts at most 5 photos of the same plant, and one organ for each */
        var data = new FormData();
        var used = Math.min(photo.files.length, 5);
        for (var p = 0; p < used; p++) {
            data.append("images", photo.files[p]);
            data.append("organs", menu.value);
        }
        var address = Canopy.plantnetUrl + "?include-related-images=false&nb-results=3&lang=en&api-key=" + Canopy.plantnetKey;

        button.disabled = true;
        Canopy.identifyMessage(results, "Looking at your photo...", "identify-wait");
        fetch(address, { method: "POST", body: data }).then(function (response) {
            if (response.status === 404) {
                Canopy.identifyMessage(results, "Pl@ntNet could not find a plant in this photo. Try a closer photo of a leaf or fruit.", "identify-error");
                return null;
            }
            if (response.status === 429) {
                Canopy.identifyMessage(results, "The daily limit of identifications has been used. Please try again tomorrow.", "identify-error");
                return null;
            }
            if (response.status === 401 || response.status === 403) {
                Canopy.identifyMessage(results, "The identification service refused the request (" + response.status + "). The API key must be set to \"expose my API key\" and this page's web address must be on its allowed list.", "identify-error");
                return null;
            }
            if (!response.ok) {
                Canopy.identifyMessage(results, "The identification service answered with an error (" + response.status + ").", "identify-error");
                return null;
            }
            return response.json();
        }).then(function (answer) {
            if (answer !== null) {
                Canopy.identifyResults(results, answer.results, nameField);
            }
        }).catch(function () {
            Canopy.identifyMessage(results, "Sorry, the identification service could not be reached.", "identify-error");
        }).then(function () {
            button.disabled = false;
        });
    });

    wrapper.appendChild(label);
    wrapper.appendChild(menu);
    wrapper.appendChild(button);
    wrapper.appendChild(results);

    var row = photo.parentNode;
    row.parentNode.insertBefore(wrapper, row.nextSibling);
};

/* ---------- Enhancement 3: preview pop-up before sending ----------
   When the form is valid, the submit is held back and a pop-up shows what
   will be sent. "Edit" closes it, "Confirm and send" sends the form.
   Uses the HTML dialog element. Browsers that do not know it send the form
   straight away.
   Idea: MDN, HTMLDialogElement.showModal()
   https://developer.mozilla.org/en-US/docs/Web/API/HTMLDialogElement/showModal */
Canopy.labelFor = function (field) {
    var label = document.querySelector('label[for="' + field.id + '"]');
    return label === null ? field.name : label.textContent.replace(":", "").trim();
};

/* Collects "label / value" pairs for everything the visitor filled in */
Canopy.collectValues = function (form) {
    var pairs = [];
    var done = {};
    for (var i = 0; i < form.elements.length; i++) {
        var field = form.elements[i];
        if (field.type === "submit" || field.type === "reset" || field.type === "hidden" || field.name === "" || done[field.name]) {
            continue;
        }
        if (field.type === "radio") {
            done[field.name] = true;
            var chosen = form.elements[field.name].value;
            pairs.push(["Contact method", chosen]);
        } else if (field.type === "checkbox") {
            pairs.push(["Agreed to be contacted", field.checked ? "Yes" : "No"]);
        } else if (field.type === "file") {
            var names = [];
            for (var f = 0; f < field.files.length; f++) {
                names.push(field.files[f].name);
            }
            pairs.push([Canopy.labelFor(field), names.join(", ")]);
        } else if (field.tagName === "SELECT") {
            pairs.push([Canopy.labelFor(field), field.options[field.selectedIndex].text]);
        } else {
            pairs.push([Canopy.labelFor(field), field.value]);
        }
    }
    return pairs;
};

Canopy.showPreview = function (form) {
    var old = Canopy.byId("preview-dialog");
    if (old !== null) {
        old.parentNode.removeChild(old);
    }
    var dialog = document.createElement("dialog");
    dialog.setAttribute("id", "preview-dialog");

    var heading = document.createElement("h2");
    heading.appendChild(document.createTextNode("Check before sending"));
    dialog.appendChild(heading);

    var list = document.createElement("dl");
    var pairs = Canopy.collectValues(form);
    for (var i = 0; i < pairs.length; i++) {
        var term = document.createElement("dt");
        term.appendChild(document.createTextNode(pairs[i][0]));
        var detail = document.createElement("dd");
        detail.appendChild(document.createTextNode(pairs[i][1]));
        list.appendChild(term);
        list.appendChild(detail);
    }
    dialog.appendChild(list);

    var edit = document.createElement("button");
    edit.setAttribute("type", "button");
    edit.setAttribute("class", "secondary-button");
    edit.appendChild(document.createTextNode("Edit"));
    edit.addEventListener("click", function () {
        dialog.close();
    });

    var confirm = document.createElement("button");
    confirm.setAttribute("type", "button");
    confirm.appendChild(document.createTextNode("Confirm and send"));
    confirm.addEventListener("click", function () {
        Canopy.clearDraft(form);
        dialog.close();
        Canopy.sendForm(form);
    });

    dialog.appendChild(edit);
    dialog.appendChild(confirm);
    document.body.appendChild(dialog);
    dialog.showModal();
};

Canopy.setupPreview = function (form) {
    form.addEventListener("submit", function (event) {
        if (event.defaultPrevented) {
            return;     /* the validation in script.js found a problem */
        }
        if (typeof HTMLDialogElement !== "function") {
            return;     /* no dialog support: send the form as normal */
        }
        event.preventDefault();
        Canopy.showPreview(form);
    });
};

/* ---------- Enhancement 2: sending the form to an API (Web3Forms) ----------
   After the checks pass and the preview is confirmed, the form data is sent
   with fetch() instead of leaving the page. Web3Forms is a free form API: it
   receives the data and emails it to me, and answers with JSON that says if it
   worked. The page then shows a thank-you or an error message.
   Ideas: MDN, Using the Fetch API and FormData; Web3Forms documentation
   https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
   https://developer.mozilla.org/en-US/docs/Web/API/FormData
   https://docs.web3forms.com/ */

/* The access key is a hidden field in each form. The same address is also in each
   form's action attribute, so the form still works if JavaScript is switched off. */
Canopy.formEndpoint = "https://api.web3forms.com/submit";

/* Shows a result message (success or failure) in the same box as the errors */
Canopy.showStatus = function (message, good) {
    var box = Canopy.byId("form-errors");
    while (box.firstChild) {
        box.removeChild(box.firstChild);
    }
    var note = document.createElement("p");
    note.setAttribute("class", good ? "form-success" : "form-failed");
    note.appendChild(document.createTextNode(message));
    box.appendChild(note);
};

/* Sends the form fields with fetch(). The free Web3Forms plan does not take file
   uploads, so only the names of the chosen photos are sent. */
Canopy.sendForm = function (form) {
    var data = new FormData(form);
    var fileInput = form.querySelector("input[type=file]");
    if (fileInput !== null) {
        data.delete(fileInput.name);
        var names = [];
        for (var i = 0; i < fileInput.files.length; i++) {
            names.push(fileInput.files[i].name);
        }
        data.append("photo-names", names.join(", "));
    }
    data.append("form-name", form.id);
    Canopy.showStatus("Sending...", true);
    fetch(Canopy.formEndpoint, {
        method: "POST",
        body: data,
        headers: { "Accept": "application/json" }
    }).then(function (response) {
        return response.json().then(function (result) {
            if (response.ok && result.success) {
                form.reset();
                Canopy.showStatus("Thank you! Your message was sent.", true);
            } else {
                Canopy.showStatus("Sorry, the message could not be sent. Please try again later.", false);
            }
        });
    }).catch(function () {
        Canopy.showStatus("Sorry, there is no connection. Please try again later.", false);
    });
};

/* ---------- Enhancement 4: plant slideshow on the home page ----------
   Shows the eight species one at a time. It starts on a random plant, moves on
   by itself every five seconds, and has Previous / Next buttons, a Pause /
   Play button and one dot for each plant. It pauses while the mouse or the
   keyboard focus is inside it, the left and right arrow keys change the plant,
   and it starts paused if the visitor has asked their device for less motion.
   Ideas: MDN, setInterval() and matchMedia()
   https://developer.mozilla.org/en-US/docs/Web/API/setInterval
   https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia */
Canopy.slides = [
    { name: "Dipterocarpus grandiflorus", image: "dipterocarpus-grandiflorus", fact: "Endangered; its fruit has two wings up to 22 cm long." },
    { name: "Dipterocarpus cornutus", image: "dipterocarpus-cornutus", fact: "Least Concern; its trunk oil was used as varnish and to seal boats." },
    { name: "Hopea nutans", image: "hopea-nutans", fact: "Near Threatened; one tree measured 82.8 m tall." },
    { name: "Hopea beccariana", image: "hopea-beccariana", fact: "Vulnerable; named after the botanist Odoardo Beccari." },
    { name: "Canarium odontophyllum", image: "canarium-odontophyllum", fact: "Known as dabai in Sarawak; the fruit is a seasonal delicacy." },
    { name: "Canarium decumanum", image: "canarium-decumanum", fact: "Up to 54 m tall, with fruits as long as 8.5 cm." },
    { name: "Santiria laevigata", image: "santiria-laevigata", fact: "Bark and resin smell of mango or turpentine; the fruit ripens yellow, red, then black." },
    { name: "Santiria apiculata", image: "santiria-apiculata", fact: "Often grows in swampy ground; fruit ripens from green to red to purplish-black." }
];

/* makes a small button with some text */
Canopy.makeButton = function (text, label, onClick) {
    var button = document.createElement("button");
    button.setAttribute("type", "button");
    button.setAttribute("class", "secondary-button");
    if (label !== "") {
        button.setAttribute("aria-label", label);
    }
    button.appendChild(document.createTextNode(text));
    button.addEventListener("click", onClick);
    return button;
};

Canopy.setupSlideshow = function (box) {
    var current = Math.floor(Math.random() * Canopy.slides.length);   /* random start */
    var playing = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var timer = null;
    var dots = [];

    var stage = document.createElement("div");
    stage.setAttribute("class", "slide-stage");
    var controls = document.createElement("div");
    controls.setAttribute("class", "slide-controls");

    /* fills the stage with the plant at position "index" */
    var show = function (index) {
        current = (index + Canopy.slides.length) % Canopy.slides.length;
        var plant = Canopy.slides[current];

        while (stage.firstChild) {
            stage.removeChild(stage.firstChild);
        }
        var picture = document.createElement("img");
        picture.setAttribute("src", "images/" + plant.image + ".jpg");
        picture.setAttribute("alt", plant.name);
        picture.setAttribute("width", "300");
        picture.setAttribute("height", "200");

        var name = document.createElement("h3");
        var italic = document.createElement("em");
        italic.appendChild(document.createTextNode(plant.name));
        name.appendChild(italic);

        var fact = document.createElement("p");
        fact.appendChild(document.createTextNode(plant.fact));

        var link = document.createElement("a");
        link.setAttribute("href", "explore3.html#" + plant.image);
        link.setAttribute("class", "btn");
        link.appendChild(document.createTextNode("Read the full profile"));

        var text = document.createElement("div");
        text.appendChild(name);
        text.appendChild(fact);
        text.appendChild(link);

        stage.appendChild(picture);
        stage.appendChild(text);

        for (var i = 0; i < dots.length; i++) {
            if (i === current) {
                dots[i].setAttribute("aria-current", "true");
            } else {
                dots[i].removeAttribute("aria-current");
            }
        }
    };

    var stop = function () {
        window.clearInterval(timer);
        timer = null;
    };
    var start = function () {
        stop();
        timer = window.setInterval(function () {
            show(current + 1);
        }, 5000);
    };

    var playButton = Canopy.makeButton("Pause", "", function () {
        playing = !playing;
        update();
    });

    /* shows the right words on the Pause / Play button and starts or stops the timer */
    var update = function () {
        playButton.firstChild.nodeValue = playing ? "Pause" : "Play";
        playButton.setAttribute("aria-label", playing ? "Pause the slideshow" : "Play the slideshow");
        stage.setAttribute("aria-live", playing ? "off" : "polite");
        if (playing) {
            start();
        } else {
            stop();
        }
    };

    controls.appendChild(Canopy.makeButton("Previous", "Previous plant", function () { show(current - 1); }));
    controls.appendChild(playButton);
    controls.appendChild(Canopy.makeButton("Next", "Next plant", function () { show(current + 1); }));

    var dotBox = document.createElement("div");
    dotBox.setAttribute("class", "slide-dots");
    for (var i = 0; i < Canopy.slides.length; i++) {
        var dot = document.createElement("button");
        dot.setAttribute("type", "button");
        dot.setAttribute("aria-label", "Show " + Canopy.slides[i].name);
        dot.addEventListener("click", (function (number) {
            return function () { show(number); };
        })(i));
        dots.push(dot);
        dotBox.appendChild(dot);
    }
    controls.appendChild(dotBox);

    /* pause while the visitor is using it, then carry on */
    box.addEventListener("mouseenter", function () { if (playing) { stop(); } });
    box.addEventListener("mouseleave", function () { if (playing) { start(); } });
    box.addEventListener("focusin", function () { if (playing) { stop(); } });
    box.addEventListener("focusout", function () { if (playing) { start(); } });
    box.addEventListener("keydown", function (event) {
        if (event.key === "ArrowLeft") {
            show(current - 1);
        } else if (event.key === "ArrowRight") {
            show(current + 1);
        }
    });

    box.setAttribute("role", "group");
    box.setAttribute("aria-roledescription", "carousel");
    box.setAttribute("aria-label", "Plant slideshow");
    box.appendChild(stage);
    box.appendChild(controls);
    show(current);
    update();
};

/* ---------- Enhancement 5: search and filter on the Species page ----------
   Adds a search box and a conservation status menu above the species list.
   Typing or choosing an option hides the profiles (and gallery pictures) that
   do not match, and a line says how many are showing. The search looks at
   the whole profile text, so a local name such as "keruing" works too. The
   status options are read from the profiles, not typed in by hand.
   Ideas: MDN, input event and Node.textContent
   https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/input_event
   https://developer.mozilla.org/en-US/docs/Web/API/Node/textContent */
Canopy.statusOf = function (row) {
    var terms = row.querySelectorAll("dt");
    for (var i = 0; i < terms.length; i++) {
        if (terms[i].textContent === "Status") {
            var words = terms[i].nextElementSibling.textContent;
            var match = /^([A-Za-z ]+?)(?: \(|;|\.|$)/.exec(words);
            if (match !== null) {
                return match[1];
            }
        }
    }
    return "Status not listed";
};

Canopy.setupSpeciesFilter = function (gallery) {
    var rows = document.querySelectorAll(".explore-row");
    var items = document.querySelectorAll(".gallery-item");
    var statuses = [];
    for (var i = 0; i < rows.length; i++) {
        var status = Canopy.statusOf(rows[i]);
        rows[i].setAttribute("data-status", status);
        if (statuses.indexOf(status) === -1) {
            statuses.push(status);
        }
    }
    statuses.sort();

    var bar = document.createElement("div");
    bar.setAttribute("class", "filter-bar");

    var searchLabel = document.createElement("label");
    searchLabel.setAttribute("for", "species-search");
    searchLabel.appendChild(document.createTextNode("Search the species"));
    var search = document.createElement("input");
    search.setAttribute("type", "text");
    search.setAttribute("id", "species-search");
    search.setAttribute("autocomplete", "off");

    var statusLabel = document.createElement("label");
    statusLabel.setAttribute("for", "species-status");
    statusLabel.appendChild(document.createTextNode("Conservation status"));
    var statusMenu = document.createElement("select");
    statusMenu.setAttribute("id", "species-status");
    var all = document.createElement("option");
    all.setAttribute("value", "");
    all.appendChild(document.createTextNode("All statuses"));
    statusMenu.appendChild(all);
    for (var s = 0; s < statuses.length; s++) {
        var option = document.createElement("option");
        option.setAttribute("value", statuses[s]);
        option.appendChild(document.createTextNode(statuses[s]));
        statusMenu.appendChild(option);
    }

    var count = document.createElement("p");
    count.setAttribute("role", "status");
    count.setAttribute("class", "filter-count");
    count.appendChild(document.createTextNode(""));

    var apply = function () {
        var query = search.value.trim().toLowerCase();
        var wanted = statusMenu.value;
        var shown = 0;
        for (var r = 0; r < rows.length; r++) {
            var matches = (query === "" || rows[r].textContent.toLowerCase().indexOf(query) !== -1) &&
                          (wanted === "" || rows[r].getAttribute("data-status") === wanted);
            rows[r].classList.toggle("filtered-out", !matches);
            if (matches) {
                shown++;
            }
        }
        for (var g = 0; g < items.length; g++) {
            var target = document.getElementById(items[g].getAttribute("href").substring(1));
            items[g].classList.toggle("filtered-out", target !== null && target.classList.contains("filtered-out"));
        }
        count.firstChild.nodeValue = shown === 0 ? "No species match your search." :
            "Showing " + shown + " of " + rows.length + " species.";
    };

    var clear = Canopy.makeButton("Clear", "Clear the search and the status", function () {
        search.value = "";
        statusMenu.value = "";
        apply();
        search.focus();
    });

    search.addEventListener("input", apply);
    statusMenu.addEventListener("change", apply);

    bar.appendChild(searchLabel);
    bar.appendChild(search);
    bar.appendChild(statusLabel);
    bar.appendChild(statusMenu);
    bar.appendChild(clear);
    gallery.parentNode.insertBefore(bar, gallery);
    gallery.parentNode.insertBefore(count, gallery);
    apply();
};

/* ---------- Other D (not counted): saved draft and comment counter ----------
   While you type, the form is saved in localStorage, so a closed tab or a
   page refresh does not lose it. The draft is removed after the form is
   sent or reset. A counter under the Comments box shows how many characters
   have been typed.
   Idea: MDN, Web Storage API
   https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API */
Canopy.draftKey = function (form) {
    return "canopyDraft-" + form.id;
};

Canopy.saveDraft = function (form) {
    var draft = {};
    for (var i = 0; i < form.elements.length; i++) {
        var field = form.elements[i];
        if (field.name === "" || field.type === "file" || field.type === "hidden" || field.type === "submit" || field.type === "reset") {
            continue;
        }
        if (field.type === "radio") {
            if (field.checked) { draft[field.name] = field.value; }
        } else if (field.type === "checkbox") {
            draft[field.name] = field.checked;
        } else {
            draft[field.name] = field.value;
        }
    }
    localStorage.setItem(Canopy.draftKey(form), JSON.stringify(draft));
};

/* Puts the saved values back, but never over something that is already
   filled in (for example the plant chosen with an Enquire button) */
Canopy.restoreDraft = function (form) {
    var saved = localStorage.getItem(Canopy.draftKey(form));
    if (saved === null) {
        return;
    }
    var draft = JSON.parse(saved);
    for (var name in draft) {
        var field = form.elements[name];
        if (!field) {
            continue;
        }
        if (field.type === "checkbox") {
            field.checked = draft[name];
        } else if (field.length !== undefined && field.type === undefined) {
            /* a group of radio buttons */
            for (var r = 0; r < field.length; r++) {
                if (field[r].value === draft[name]) { field[r].checked = true; }
            }
        } else if (field.value === "") {
            field.value = draft[name];
        }
    }
};

Canopy.clearDraft = function (form) {
    localStorage.removeItem(Canopy.draftKey(form));
};

Canopy.setupDraft = function (form) {
    Canopy.restoreDraft(form);
    form.addEventListener("input", function () { Canopy.saveDraft(form); });
    form.addEventListener("change", function () { Canopy.saveDraft(form); });
    form.addEventListener("reset", function () { Canopy.clearDraft(form); });
};

/* The counter under the Comments box */
Canopy.setupCounter = function (form) {
    var box = form.querySelector("textarea");
    var counter = document.createElement("span");
    counter.setAttribute("class", "char-count");
    box.parentNode.appendChild(counter);
    var update = function () {
        counter.textContent = box.value.length + " characters";
    };
    box.addEventListener("input", update);
    form.addEventListener("reset", function () { setTimeout(update, 0); });
    update();
};

/* ---------- Start-up ---------- */

Canopy.initEnhancements = function () {
    Canopy.setupDropdown();
    Canopy.highlightCurrentPage();

    var slideshow = Canopy.byId("plant-slideshow");
    if (slideshow !== null) {
        Canopy.setupSlideshow(slideshow);
    }

    var gallery = Canopy.byId("species-gallery");
    if (gallery !== null) {
        Canopy.setupSpeciesFilter(gallery);
    }

    var forms = ["enquiry-form", "contribute-form"];
    for (var i = 0; i < forms.length; i++) {
        var form = Canopy.byId(forms[i]);
        if (form !== null) {
            Canopy.setupDraft(form);
            Canopy.setupCounter(form);
            Canopy.setupLiveFeedback(form);
            Canopy.setupPreview(form);
            Canopy.setupIdentify(form);
        }
    }
};

document.addEventListener("DOMContentLoaded", Canopy.initEnhancements);
