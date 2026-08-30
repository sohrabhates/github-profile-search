<div align="center">

# 🔎 DevFinder

### GitHub Profile Search & Repository Explorer

A modern, responsive web application that uses the GitHub REST API to search GitHub users, display profile statistics, and discover their top repositories.

<br>

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![GitHub API](https://img.shields.io/badge/GitHub%20REST%20API-181717?style=for-the-badge&logo=github&logoColor=white)](https://docs.github.com/en/rest)

</div>

---

## 🌐 Live Demo

🚀 **[View DevFinder Live](https://github-profile-search-ochre.vercel.app/)**

---

## 📸 Preview

<!-- Replace the image below with a screenshot of your application -->

![DevFinder Preview](./assets/screenshot.png)

---

## 📖 About

**DevFinder** is a GitHub profile search application built with vanilla HTML, CSS, and JavaScript.

Users can search for any GitHub username and retrieve real-time profile information directly from the GitHub REST API.

The application displays important profile statistics along with the user's four most popular repositories, ranked using a combined stars-and-forks popularity score.

This project was built to practice working with **REST APIs, asynchronous JavaScript, DOM manipulation, responsive UI design, and browser storage**.

---

## ✨ Features

- 🔎 Search GitHub users by username
- 👤 Display GitHub avatar and profile information
- 📊 Display followers, following, and public repository counts
- 📝 Display user bio and additional profile details
- 📍 Display location and website when available
- 📦 Fetch public repositories using the GitHub REST API
- ⭐ Display repository star counts
- 🍴 Display repository fork counts
- 💻 Display primary programming language
- 🏆 Automatically determine the top 4 repositories
- 🔗 Direct links to repositories
- 🌙 Dark and light mode
- 💾 Persistent theme preference using `localStorage`
- ⌨️ Search using the Enter key
- ⚡ Loading skeletons
- 🚨 User-friendly error handling
- 📱 Responsive design for mobile, tablet, and desktop
- ❌ Clear search input functionality
- ⚡ Quick-search suggestions

---

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| HTML5 | Application structure |
| CSS3 | Styling, responsive layout and themes |
| JavaScript ES6+ | Application logic |
| Fetch API | API requests |
| GitHub REST API | User and repository data |
| localStorage | Theme persistence |
| Vercel | Deployment |

No frontend frameworks or external dependencies are required.

---

## 🔌 API Integration

DevFinder uses the public **GitHub REST API**.

### User Profile

```text
GET https://api.github.com/users/{username}
