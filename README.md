# WebBlog
Basic Markdown Blog

## Installation
1. install MariaDB
2. run createDB
3. run start
4. profit

For alternative database installations modify the createDB script to make use of your database.
For a root user on the DB other than 'root' without a password, again edit the createDB script.

## Usage
Well, it's a WebBlog so just go to localhost:8080 in your browser and enjoy the blog.

/blog shows all blog entries (at least a preview) clicking on one will show you the whole thing.
But I think I don't have to explain that to you.

/new will let you create a new blogentry, so far editing is not implemented and
posts with already existing headings will be ignored.

## Feedback

Is very much appreciated!

## Dependencies
- MariaDB (or other Database)
- nodejs:
  - nodemon
  - ejs
  - marked
  - path
  - fs
  - express
  - body-parser
