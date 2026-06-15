---
sidebar_position: 3
---

# Using Leo as a PIM

This chapter tells how you can use Leo as a _Personal Information Manager_. It introduces **clones**: one of Leo's most unusual and powerful features for organizing data.

## Clones

A **clone** is a node that appears in more than one place in a Leo outline. A small red arrow in the icon box marks each clone. All clones of a node are actually _the same node_:

- Any change to one clone affects all clones.
- Inserting, moving, or deleting any child of a clone will change all other clones on the screen.

`` Ctrl-` `` (clone-node)\
Clones a node. The shortcut uses [backtick (grave accent)](https://superuser.com/questions/254076/how-do-i-type-the-tick-and-backtick-characters-on-windows), _not_ a single quote. This character is often on the same keyboard key as the tilde `~` character.

> 🧪 **Take a few moments to experiment with clones:**
>
> - Create a node whose headline is A.
> - Clone node A with the `clone-node` command.
> - Type some text into the body of A.
> - All clones of A now have the same body.
> - Insert a node, say B, as a child of any of the A nodes.
> - Notice that _all_ the A nodes now have a B child.
> - See what happens if you clone B.
> - See what happens if you delete or move nodes that are children of A.
> - When you delete a node's penultimate clone, the node is no longer a clone.

## Clones create views

To start a project, clone nodes related to the project and drag them at or near the top level, where you can get at them easily. When the project is complete, just delete the clones. This workflow is surprisingly effective:

- The original nodes never move, but they change whenever their clones do.

- There is nothing to "put back in place" when you are done. Just delete the clones.

Used this way, **clones create views**: when you gather cloned nodes together for a project, you are, in effect, creating a project-oriented view of the outline. This view **focuses your attention** on only those nodes that are relevant to the task at hand.

## Using abbreviations and templates

Leo optionally expands abbreviations as you type. Abbreviations typically end with something like `;;` so they won't trigger by accident.

Abbreviations are enabled by default through the following setting in myLeoSettings.leo:

```
    @bool enable-abbreviations = True
```

You define abbreviations in `@data abbreviations` nodes or `@data global-abbreviations` nodes.

> 🎁 Some come predefined in `@data global-abbreviations` such as **date;;** and **html;;**.

Abbreviations can be shortcuts:

```
    ncn;;=@nocolor
```

Abbreviations can span multiple lines. Continued lines start with `\:`, like this:

```
    form;;=<form action="main_submit" method="get" accept-charset="utf-8">
    \:<p><input type="submit" value="Continue &rarr;"></p>
    \:</form>\n
```

Abbreviations can define templates in which `<|a-field-name|>` denotes a field to be filled in:

```
    input;;=<input type="text/submit/hidden/button"
    \:name="<|name|>"
    \:value="" id="<|id|>">\n
```

Typing `F3` after inserting a template selects the next field.

Abbreviations can execute **abbreviation scripts**, delimited by `{|{` and `}|}`:

```
    date;;={|{return new Date().toString().slice(0,24)}|}
```

To use abbreviations scripts, enable them in myLeoSettings.leo as follows:

```
    @bool scripting-abbreviations = True
```

With abbreviation scripts enabled, typing `date;;` gives:

```
    Sun Jun 14 19:51:44 2026
```

It's even possible to define a context in which abbreviation scripts execute. See leoSettings.leo for full details.

## Using URLs

Leo highlights URLs whenever syntax is coloring is enabled.

`open-url-under-cursor` 🖱️ _Alt+Click_ or _Ctrl-Click_\
 Opens the URL under the cursor.

`open-url`\
 Opens a URL appearing either in the headline or the first line of body text. If a headline starts with `@url`, the rest of the headline is taken to be a url.

## Using Chapters

@chapter trees denote a **chapter**. You can **activate** a chapter from the icon area, or with chapter-select commands. Activating a chapter makes only those nodes in the chapter visible. The `main` chapter represents the entire outline. Activating the `main ` chapter shows all outline nodes.

`chapter-select-main`\
 Selects the main chapter.

`chapter-select-<chapter-name>`\
 Selects a chapter by name.

## Summary

Clones are nodes appearing in multiple places in the outline.

- Changes to one clone affect all other clones.
- All clones of a node are _exactly the same node_.

Views allow multiple views of data to exist in a single outline.

- A view is simply a collection of nodes.
- View focus attention on tasks and reduce searching for nodes.

Leo expands abbreviations as you type.

- Abbreviations range from simple shortcuts to multi-line templates containing fields.
- Type `F3` to move to the next field.
- Abbreviations can also insert the result of executing code.

Ctrl-clicking any URL opens the URL.

@chapter trees denote chapters. Activating a chapter shows only the nodes in that chapter.
