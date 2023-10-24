# Sulfurous

### Research report - Institute of Networked and Embedded Systems Alpen-Adria-University

### Alexander Pichler 03.10.2023 Version 1.2

# 1 Abstract

This research report serves as a final summary of my work at the Institute of Networked and Embedded Systems of the Alpen-Adria University regarding scratch and the Sulfurous player. Furthermore it will be shown why an external scratch player is still a useful alternative to the original scratch environment provided by the MIT.

The main part of my work at the NES was the development of additional features and a conversion system that works with the new sb3 standard for the sulfurous player. All of this development was done in Java Script. 

Sulfurous has many features that are missing in the original scratch player that can be used to extend the projects you build. They are easy to use and implement and do not interfere with players who run the games in the normal scratch player.

# 2 Scratch

![Untitled](/imgs/img0.png)

Scratch is a programming language for children that was developed by the Massachusetts Institute of Technology (MIT) Media Lab Lifelong Kindergarten Group. It was first released in 2007 and has since become popular worldwide. Scratch allows children to create their own interactive stories, games, and animations using a visual programming language that is easy to learn. The platform also provides an online community where users can share their creations with others. In addition, Scratch has been used in schools and educational settings to teach children programming concepts and encourage creativity.

### Why should you use Scratch?

### Pros:

- Easy to use
    - The usage of visual blocks for programming makes it esay to start to develop with scratch.
- no downloads
    - Scratch works fully within your browser. This allows everybody to create or use it in nearly every device.
- Platform independent
    - Since Scratch runs in every modern HTML5 capable browser it can be used on all common platforms

### Cons:

- Limited in possibilities
    - The big downside of block programming is that more complex code can be hard or imposible to implement. Scratach also does not provide a way to interact with the browser directlly which further limits the possible applications.
- Slow execution
    - Scratch is live compiled in the browser this is slower than running fully compiled executables.

## 2.1 How does Scratch work?

### Scratch is single threaded by design.

> The first thing to understand is that Scratch doesn’t run separate blocks of code at the same time. It takes turns between blocks (or threads as the Scratch source code refers to them). Before you execute any code in Scratch no threads are running. If you click the green flag then any block of code attached to a green flag hat block will be added to the active threads.
> 

The green flag clicked block is not the only one that is able to add blocks to the active thread list.

![Untitled](/imgs/img1.png)

> Hat blocks are unique because they are added to the active thread list in response to events whether that event is the green flag being pressed, the volume reaching a certain level or a broadcast message being received. These are the hat blocks that can be used in Scratch
> 

### Clones

If a clone is created it gets added to the active thread list.

> It is worth noting that when a clone is created, the data for that clone is initialized when the block is encountered and not when the queued thread is executed.
> 

That means it could be a problem if data changed between adding the block to the active threads and executing the block

### **Threads and yield points**

To make the program look like it runs multithreaded so called yield points are used. Yield points are points in the program where the active thread is changed. This is necessary for the multithreaded look an feel of Scratch. 

> This process continues from thread to thread (and then back to the first) until all threads have completed execution. Now, the points at which execution will yield are -
> 
> - At the end of any loop (forever, repeat, repeat until)
> - Each time a wait until block is false (as this is effectively a loop)
> - At a stop all (for obvious reasons)
> - After a broadcast and wait
> - At a wait block (again on every iteration until the required time has elapsed)

### **Why custom blocks are so useful**

Custom blocks have the ability to ignore the yield points if the “Run without screen refresh” checkbox is ticked. 

If this box is ticked the whole code of the custom block is executed without switching the active thread which means it runs in a blocking state.

All Quotes from: [https://rokcoder.com/tips/inner-workings.html](https://rokcoder.com/tips/inner-workings.html) (accessed 2023-06-20)

### Scratch as a game platform

Scratch allows you to share your game projects and build communities. The main page and the explore page makes it easy to find new games to play. On the explore site you can use filters to tailor the results to your liking. If you found a game you want to play the experience is seamless. You have the possibility to interact with other players and the creator via the commands feature.

As you can see the end user experience is really good. The one weak factor is that there is no way for a creator to get paid for their games. This is where platforms like [Itch.io](http://Itch.io) come in.

# 3 Itch.io

[Itch.io](http://Itch.io) is a video game distribution platform for indie games. 

The platform allows you to upload and host games for all platforms. It is also allows to upload assets and tool for others to use.

It is a really easy process to upload and monetize your games the pricing options include:

- Free
- Donation
- Paid

The community experience on [Itch.io](http://Itch.io) is also way better than on scratch. Itch.io hosts game jams and you can write devlogs to keep your community updated.

# 4 Sulfurous

Sulfurous is a JavaScript player for Scratch. It allows to run Scratch projects faster and with more features.

**Why?**

Scratch used to work with Adobe Flash Player which is slow compared to JavaScript execution. We wanted to improve the overall performance of Scratch and add additional features to it. To do so we needed to either extend the original Scratch player or implement a new one. The second option was the better one. There were some projects that had the same goal in mind. We used Phosphorus as a starting point for our player. 

### 4.1 Additional Features

- Custom JS execution
    
    In Sulfurous it is possible to execute custom JavaScript code inside your scratch project
    
    How to:
    
    ![Create a new block](/imgs/img2.png)
    
    Create a new block
    

![Name the block “sulf.script” add a input of type “number or text” you can call it however you want](/imgs/img3.png)

Name the block “sulf.script” add a input of type “number or text” you can call it however you want

![Now you can use custom JS executions in your scratch projects](/imgs/img4.png)

Now you can use custom JS executions in your scratch projects

You can try this example here:

Scratch: [https://scratch.mit.edu/projects/237120625](https://scratch.mit.edu/projects/237120625)

Sulfurous: [https://sulfurous.aau.at/#237120625](https://sulfurous.aau.at/#237120625)

On Scratch you will see that nothing is happening when you press the Space Bar. If you run this project on sulfurous the color of the list background will change to red and a alert will show in the browser.

- Sulf Vars
    - Sulf vars are a bunch of information you can get about the player the user is currently running
    - List of Sulf Vars
    
    | Name | Value |
    | --- | --- |
    | sulf.time | Current time in milli seconds |
    | sulf.hasTouchEvents | Boolean to check if the browser supports touch inputs |
    | sulf.resolutionY | Y resolution of the canvas |
    | sulf.resolutionX | X resolution of the canvas |
    | sulf.version | Current Version of sulfurous |
    | sulf.p.username | Username of the Player currently running the game |
    - The “sulf.p.username” is automatically created the first time a user opens sulfurous and is defined as “Player*****” where ***** is a random number. This username can be used for multiplayer games. It is currently not possible for a user to choose their username.
    
    How to: 
    
    ![Create a new variable](/imgs/img5.png)
    
    Create a new variable
    
    ![Name the variable “sulf.***” as listed in to table above.](/imgs/img6.png)
    
    Name the variable “sulf.***” as listed in to table above.
    
    You can use the created variables like any other variables in your project
    
    You can try this example here:
    
    Scratch: [https://scratch.mit.edu/projects/235462997](https://scratch.mit.edu/projects/235462997)
    
    Sulfurous: [https://sulfurous.aau.at/#235462997](https://sulfurous.aau.at/#235462997)
    

- Cloud Variables
    
    We made it possible to create and access variables that are saved on the sulfurous server this allows creators to do many helpful things. e.g. : cloud saves, leaderboards …
    
    Scratch does support their own cloud variables. If your projects already includes scratch cloud variables you do not need to change anything in your project. Sulfurous will detect these variables and use them as sulf cloud variables.
    
    Cloud variables are defined with “sulf.c.****”
    
- Cookie Variables
    
    Cookie Variables have the same possibilities as our cloud variables with the difference that the data is saved in the users browser
    
    Cloud variables are defined with “sulf.p.****”
    
    How to: 
    
    ![Create a new variable](/imgs/img5.png)
    
    Create a new variable
    
    ![Name the variable “sulf.p.*****” or “sulf.c.*****” depending on if you want it to be a cloud or cookie variable](/imgs/img6.png)
    
    Name the variable “sulf.p.*****” or “sulf.c.*****” depending on if you want it to be a cloud or cookie variable
    
    You can try this example here:
    
    Scratch: [https://scratch.mit.edu/projects/862049228](https://scratch.mit.edu/projects/862049228)
    
    Sulfurous: [https://sulfurous.aau.at/#862049228](https://sulfurous.aau.at/#862049228)
    

## 4.2 Inner workings

Sulfurous consists of 4 main components depending on which components are running certain features may not be available

|  | FRONTEND | BACKEND | CONVERTER |
| --- | --- | --- | --- |
| Sulfurous SB2 | ✔️ | ✔️ | ✖️ |
| Sulfurous Cloud | ✔️ | ✔️ | ✖️ |
| Sulfurous SB3 | ✔️ | ✔️ | ✔️ |
| Sulfurous SB3+ Cloud | ✔️ | ✔️ | ✔️ |

### Frontend

The frontend is written in plain HTML CSS and JavaScript. All the inner workings of the sulfurous player that are needed to play the scratch game are on the frontend so no backend is needed to play sb2 projects. All new sb3 projects need to be converted back to sb2 via the backend to be played 

This was true until 05/23 from now on the sulfurous player needs the backend to load Scratch projects from their servers

- Overview of the Frontend Structure
    - admintools
        - contains the website for the admintools
    - css
        - All the css is in here
    - fonts
        - In here is a font file used in the admintools
        - Also the scratch font is stored here
    - html
        - HTML for embedded sulfurous
    - img
        - The place for all the images used on the website
    - js
        - All the inner workings of the player are in here
    - soundbank
        - contains all scratch sounds to be uses in projects
    - index.html
        - Contains the structure of the website
        - loads the js and css files

### Player Program structure

- app.js
    - This file contains the logic to load the embedded version of sulfurous
- embed.js
    - Not used
- fonts.js
    - Used to setup google fonts
- index.js
    - This is the entry point it contains all EventListner on the main page
    - The Scratch projects are also loaded into the player from this file
    - The detection for external hosting e.g. [Itch.io](http://Itch.io) is also in there
- phosphorus.js
    - This file has two main parts the Scratch compiler and the sulfurous specific variables
    - Sulfurous Cloud Cookie and environment Variables are loaded in here
    - The main part of Sulfurous is the “P” variable it is a object containing all things Sulfurous needs to play Scratch projects
- player.js
    - Manages the UI for the player
    - Invokes the Sulfurous Scratch interpreter with the project to run
- shaders.js
    - Contains shaders used by the player
- websocket.js
    - Sets up the sebsocket connection used for realtime communication with the backend
- External Libs
    - gl-matrix
        - Fast matrix and vector calculations
    - gyronorm
        - **Standalone device orientation + motion detection, normalization and conversion library**
        - https://github.com/adtile/Full-Tilt
    - jquery qrcode / qrcode
        - Used to create qrcodes
    - socket.io
        - Used for realtime communication with the backend

### Backend

The backend contains some of the logic for the conversion form the new sb3 format to the sb2 format that is used by the sulfurous player. Furthermore the cloudsave and some basic Admin tools are also in the backend

- Used Technologies
    
    The backend is written in Node.js which allows for fast development and easy deployment in docker containers. All the communication to the frontend is done with websockets wrapped in [Socket.Io](http://Socket.Io). The websocket connection is used for realtime connections with multiple clients which is necessary for some features of sulfuourus for example the clooudsave and the admintools.
    
- Conversion
    
    The backend part of the conversion is downloading the sb2 files either directly from scratch via the ID or from the frontend if a user drags a sb3 file into the player. Also the converted files are served to the user from the backend. 
    
- Cloudsave
    
    Every project that uses cloud variables has a json file that holds all the data that is necessary. The files are periodicly saved to unsure a server fault does not mess with the savestates. The data is served like all the other backand data with websockets.
    
- Admintools
    
    The admin tools are currently not that advanced the provide a basic overview of the current connections to sulfurous and the connections over the last hour, 24 hours, and 30 days.
    
    Also logs about the last 10 sb2 and sb3 projects are on the admintools.
    
    ![Untitled](/imgs/img7.png)
    

### Converter

The converter receives the projects that need to be converted from the backend. This works via a bash script that looks for new work in a folder. The conversion is done with a modified version of the python converter script from [RexScratch](https://github.com/RexScratch/sb3tosb2). 

## 4.3 Naming

Why is Sulfurous called Sulfurous? Our predecessor was the Phosphorus player it used the Element phosphorus as its name we thought we should continue this and use the next element Sulfur. To stay more true to the original name we added the sufix “ous”.

![Untitled](/imgs/img8.png)

# 5 Alternative projects and feature comparison

## 5.1 Phosphorus

The Phosphorus player is the basis of our Sulfurous and was one of the best SB2 Players. It hast no SB3 support. Is was developed by Nathen on Github. The repository not available anymore. 
The player is still online but does not work since the change in the Scratch backend that also forced us to change to a mandatory backend for the sulfurous.

Link: [https://phosphorus.github.io/](https://phosphorus.github.io/)
Repo:   

[https://github.com/nathan/phosphorus](https://github.com/nathan/phosphorus)

## 5.2 Turbowarp

Turbowarp consists of three parts:

- Player
    
    The player from Turbowarp is one of the most advanced external players it addons and many custom settings to change the behaviour. 
    
    Link: [https://turbowarp.org/](https://turbowarp.org/)
    
- Packager
    
    Turbowarp has a packager that allows you to export your scratch games to all major desktop platforms.
    
    Link: [https://packager.turbowarp.org/](https://packager.turbowarp.org/)
    
- Desktop
    
    The Turbowarp desktop app is a editor and player for scratch projects that run in the Turbowarp compiler.
    
    Link: [https://desktop.turbowarp.org/](https://desktop.turbowarp.org/)
    

Repo: 

[TurboWarp](https://github.com/TurboWarp)

## 5.3 Forkphorus

Forkphorus is based on Phosphorus and Sulfurous it can play SB1 SB2 and SB3 projects.

It supports everything but JS execution. Forkphorus uses turbowarp in the backend to work with the new Scratch API changes.

It has additional settings that can be applied on the fly.

![Untitled](/imgs/img9.png)

Link: [https://forkphorus.github.io/](https://forkphorus.github.io/)

Repo: 

[https://github.com/forkphorus/forkphorus](https://github.com/forkphorus/forkphorus)

## 5.4 Leopardjs

Leopardjs converts scratch projects to JavaScript in a way that the code is well formatted and human readable that allows a developer to port their game to JavaScript with ease.

In my testing leopard did not work as well as expected most projects I wanted to try did not even load at all. Also SB2 projects are not supported by leopard it has now conversion to SB3. To use it with old projects you first have to convert them on your one to the new SB3 format.

Link: [https://leopardjs.com/](https://leopardjs.com/)

Repo: 

[Leopard](https://github.com/leopard-js)

## 5.5 Capabilities of different Scratch Players

|  | Scratch | Sulfurous | Phosphorous | Forkphorus | Turbowarp | Leopardjs |
| --- | --- | --- | --- | --- | --- | --- |
| SB2 | ✔️ | ✔️ | ❌ | ✔️ | ✔️ | ❌ |
| SB3 | ✔️ | ✔️ | ❌ | ✔️ | ✔️ | ✔️ / ❌ |
| Cloud Variables | ✔️ | ✔️ | ❌ | ✔️ | ✔️ | ❌ |
| JS execution | ❌ | ✔️ | ❌ | ❌ | ❌ | ✔️ |
| Packaging for external use | ❌ | ✔️ | ❌ | ✔️ | ✔️ | ✔️ |
| Self hosting | ❌ | ✔️ | ✔️ | ✔️ | ✔️ | ✔️ |

## 5.6 Benchmarks

- PC Specifications
    
    All Benchmarks are run on a 4k Display with a PC containing the following components
    
    - AMD Ryzen 7 5800x
    - Nvidia 2080Ti
    - 64GB DDR4 3200MHz RAM
    - 1TB Samsung 980Pro NVME SSD

Disclaimer:

Leopardjs does only support SB3 project but none of the benchmarks did load on it even after conversion to SB3

- BM1 Penman
    
    Penman is a test to see how many Penman can be drawn while maintaining 12-14 fps
    
    Some players run much faster than from the benchmark expected and reach the limit of Penman that can be drawn while still having a high frame rate. Because of that the amount of Penman and the reached framerate will be shown in the table.
    
    [https://scratch.mit.edu/projects/95183023/](https://scratch.mit.edu/projects/95183023/)
    
- BM2 ****Scratch Benchmark PRO****
    
    This Benchmark Tests the raw CPU Performance of the player higher score is better.
    
    [https://scratch.mit.edu/projects/100569167](https://scratch.mit.edu/projects/100569167)
    

|  | Scratch | Sulfurous | Phosphorous | Forkphorus | Turbowarp | Leopardjs |
| --- | --- | --- | --- | --- | --- | --- |
| BM1 | 301 / 23fps | 302 / 170fps | ❌ | 302 / 100fps | 301 / 30fps | ❌ |
| BM2 | 80.8 | 519.6 | ❌ | 229.6 | 749.1 | ❌ |

# 6 Sulfurous on Itch.io

With sulfurous you are able to host your Scratch games on [Itch.io](http://Itch.io). 

You just need to load your project in Sulfurous and use the “Package ZIP” option. This will build a standalone version of sulfurous that automatically loads your project in package mode.

![Untitled](/imgs/img10.png)

To use the package version you just need to unzip the “OUTPUT.zip” file in the root of your webserver or upload the zip to [Itch.io](http://Itch.io). 

[Itch.io](http://Itch.io) will automatically do the unzipping and hosting for you if you set your kind of project to HTML

![Untitled](/imgs/img11.png)

# 7 Self hosting

Since sulfurous is completely open source your can host it yourself.

## 7.1 Requirements

- docker
- docker-compose
- git

## 7.2 How to

Replace TYPE with the appropriate version you want to run.

SB2: only old SB2 projects will work

SB3: old and new projects will work

Linux:

```bash
git clone https://github.com/Mittagskogel/Sulfurous
cd ./Sulfurous
./startSulfurous[TYPE].sh
```

Windows:

```powershell
git clone https://github.com/Mittagskogel/Sulfurous
cd .\Sulfurous
.\startSulfurous[TYPE].bat
```

After the docker containers are up you can access sulfurous on [http://localhost:3000](http://localhost:3000)
