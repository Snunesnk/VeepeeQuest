/// <reference path="../node_modules/@workadventure/iframe-api-typings/iframe_api.d.ts" />
import { bootstrapExtra } from "@workadventure/scripting-api-extra";

console.log("Script started successfully");

// Easter egg part
let easterEgg = {
    nbDuckCatched: 0,
    isPlayerTeleporting: false
};

const ducks = [
    {
        x: 18,
        y: 17,
        message: ""
    },
    {
        x: 32,
        y: 15,
        message: ""
    },
    {
        x: 15,
        y: 10,
        message: ""
    },
    {
        x: 13,
        y: 2,
        message: ""
    },
    {
        x: 13,
        y: 0,
        message: ""
    },
    {
        x: 13,
        y: 19,
        message: ""
    },
    {
        x: 15,
        y: 13,
        message: ""
    },
    {
        x: 23,
        y: 4,
        message: ""
    },
]

async function isUserOnCurrentDuck() {
    const userPos = await WA.player.getPosition();

    // Get ducks coordinate and calculate the minimu and maximum values
    // for the player to be on the correct tile.
    // Tiles are 32*32, so the position is tile pos * 32 for the minimum,
    // and + 32 for the maximum.
    // Maybe the calculation is not entirely correct and a few pixels are missing, but it works
    const duck = ducks[easterEgg.nbDuckCatched];

    const xMin = duck.x * 32;
    const xMax = xMin + 32;
    const yMin = duck.y * 32;
    const yMax = yMin + 32;

    if (userPos.x >= xMin
        && userPos.x <= xMax
        && userPos.y >= yMin
        && userPos.y <= yMax)
        return true;
    return false
}

let highlightedTiles: any = [];

// Interval to make the lab blink
const intervalId = setInterval(() => {
    if (easterEgg.nbDuckCatched >= 4 && easterEgg.nbDuckCatched < 6) {
        WA.room.showLayer("secretZoneWalls");
        setTimeout(() => WA.room.hideLayer("secretZoneWalls"), 650);
    }
}, 10000);
function toggleEaster() {
    // Do not let an user take the duck while teleporting
    if (easterEgg.isPlayerTeleporting)
        return;

    // Check if user is on the coordinates of the current duck's position
    isUserOnCurrentDuck().then(res => {
        if (!res) {
            return;
        }

        let tiles = []

        // Make the actual duck disappear
        tiles.push({
            x: ducks[easterEgg.nbDuckCatched].x,
            y: ducks[easterEgg.nbDuckCatched].y,
            tile: "emptyBlock",
            layer: "easterEggZone"
        });


        // Increment ducks catched
        if (easterEgg.nbDuckCatched < ducks.length - 1) {
            easterEgg.nbDuckCatched += 1;

            // If the third duck is caught, then it's time for some secret passage !
            if (easterEgg.nbDuckCatched === 3) {
                tiles.push(
                    // Remove collide blocks
                    {
                        x: 15,
                        y: 2,
                        tile: "emptyBlock",
                        layer: "collides"
                    },
                    {
                        x: 14,
                        y: 2,
                        tile: "emptyBlock",
                        layer: "collides"
                    });
            }

            // When the users get the 4th duck, show briefly the secret passage.
            // Also set a timeout that is going to show the labyrinthe periodically
            if (easterEgg.nbDuckCatched === 4) {
                WA.room.showLayer("secretZoneWalls");
                setTimeout(() => WA.room.hideLayer("secretZoneWalls"), 500)
            }

            // If all the ducks inside the labyrinthe have been caught, then stop making it blink
            // Add collide block in front of the chimney, so the user doesn't get teleported at this point and lose all his progession 
            if (easterEgg.nbDuckCatched === 6) {
                clearInterval(intervalId);

                const collideBlocks = [
                    {
                        x: 31,
                        y: 2,
                        tile: "collideBlock",
                        layer: "teleportationZone"
                    },
                    {
                        x: 32,
                        y: 2,
                        tile: "collideBlock",
                        layer: "teleportationZone"
                    },
                ]
                WA.room.setTiles(collideBlocks);
            }

            // Show final layers
            if (easterEgg.nbDuckCatched === 7) {
                // Remove higlighted tiles
                highlightedTiles = highlightedTiles.map((tile: any) => {
                    return {
                        ...tile,
                        tile: "emptyBlock"
                    };
                })
                WA.room.setTiles(highlightedTiles);

                // Remove collide blocks in front of the chimney

                const collideBlocks = [
                    {
                        x: 31,
                        y: 2,
                        tile: "emptyBlock",
                        layer: "teleportationZone"
                    },
                    {
                        x: 32,
                        y: 2,
                        tile: "emptyBlock",
                        layer: "teleportationZone"
                    },
                ]
                WA.room.setTiles(collideBlocks);

                WA.room.showLayer("throneLayer");
                WA.room.showLayer("kingDuckLayer");
            }
        }
        // Display final message
        else {
            openPopup("congratulation")
            WA.room.hideLayer("kingDuckLayer");
            setTimeout(() => closePopup(), 5000);

            return;
        }

        // Place the next duck
        tiles.push({
            x: ducks[easterEgg.nbDuckCatched].x,
            y: ducks[easterEgg.nbDuckCatched].y,
            tile: "duck",
            layer: "easterEggZone"
        });

        WA.room.setTiles(tiles);
    });
}

// Highlight a teleporting tile the user was on
function highlightTile(tileX: number, tileY: number) {
    const tiles = [
        {
            x: tileX,
            y: tileY,
            tile: "teleportationTile",
            layer: "easterEggZone"
        }
    ]

    highlightedTiles.push(tiles[0]);

    WA.room.setTiles(tiles);
}

function teleportPlayer() {
    // If the player is already teleporting or if he didn't find enough ducks, then disable teleportation
    if (easterEgg.isPlayerTeleporting || easterEgg.nbDuckCatched !== 6)
        return;

    easterEgg.isPlayerTeleporting = true;

    WA.controls.disablePlayerControls()

    // Get the player coordinates to determine where he should go
    WA.player.getPosition().then(pos => {
        const tileX = Math.floor(pos.x / 32);
        const tileY = Math.floor(pos.y / 32);
        const tilePos = tileX + " " + tileY;
        let x;
        let y;

        switch (tilePos) {
            case "18 3":
                // Teleport the player to the second zone
                x = 1024;
                y = 416;
                break;

            case "28 18":
                // Teleport the player to the third zone
                x = 832;
                y = 416;
                break;

            case "24 16":
                // Teleport the player to the last zone
                x = 544;
                y = 416;
                break;

            case "18 17":
                // Teleport the player to the final duck !!
                x = 480;
                y = 448;
                break;

            default:
                // Highlight the teleporting tile
                highlightTile(tileX, tileY);

                // Teleport player to the entrance
                x = 736;
                y = 96;
                break;
        }

        // Teleport the player to the entrance
        WA.player.moveTo(x, y, 13).then(() => {
            WA.controls.restorePlayerControls();
            easterEgg.isPlayerTeleporting = false
        });
    })

}

let currentPopup: any;
const declineGameText = "It's not for me"
const acceptGameText = "Challenge accepted!"
const config: any = {
    crackTheCode: {
        message: "Play the crack the code game! The 1st scavenger hunt challenge on Veepee Quest. Click below to discover the page instruction and where to put the clue answers.",
        buttons: [
            {
                label: "PADLOCK PAGE",
                className: "primary",
                callback: () => WA.nav.openCoWebSite("https:\/\/forms.gle\/HE7P5Ue3KUyPpf956").then(() => closePopup()),
            },
            {
                label: "GAME INSTRUCTION",
                className: "primary",
                callback: () => WA.nav.openCoWebSite("https:\/\/valdotr.github.io\/veepee-quest-map\/src\/assets\/game\/VEEPEE_QUEST_GAME_INSTRUCTION.pdf").then(() => closePopup()),
            },
        ]
    },
    easterEgg: {
        message: "Oh no... All my ducks escaped :(\nCan you catch them for me please?",
        buttons: [
            {
                label: "close",
                className: "normal",
                callback: () => {
                    closePopup();
                },
            },
        ]
    },
    congratulation: {
        message: "Awesome! Thanks for your help!",
        buttons: [
            {
                label: "close",
                className: "normal",
                callback: () => {
                    closePopup();
                },
            },
        ]
    },
    crackTheCodeAmsterdam: {
        message: "Congrats, you just found the orange bicycle, click to discover the riddle of the lock 2",
        buttons: [
            {
                label: declineGameText,
                className: "normal",
                callback: () => closePopup(),
            },
            {
                label: acceptGameText,
                className: "primary",
                callback: () => WA.nav.openCoWebSite("https:\/\/valdotr.github.io\/veepee-quest-map\/src\/assets\/game\/RIDDLE-2-CYPHER-GAME-IN-NETHERLANDS-AMSTERDAM-(ORANGE)-BIKE.pdf").then(() => closePopup()),
            },
        ]
    },
    crackTheCodeBarcelone: {
        message: "Congrats, you just found the Umbrella, click to discover the riddle of the lock 4",
        buttons: [
            {
                label: declineGameText,
                className: "normal",
                callback: () => closePopup(),
            },
            {
                label: acceptGameText,
                className: "primary",
                callback: () => WA.nav.openCoWebSite("https:\/\/valdotr.github.io\/veepee-quest-map\/src\/assets\/game\/RIDDLE-4-DECODER-DISC-SPAIN-BARCELONA-PARASOL-ITEM.pdf").then(() => closePopup()),
            },
        ]
    },
    crackTheCodeBrussels: {
        message: "Congrats, you just found the Manneken pis, click to discover the riddle of the lock 5",
        buttons: [
            {
                label: declineGameText,
                className: "normal",
                callback: () => closePopup(),
            },
            {
                label: acceptGameText,
                className: "primary",
                callback: () => WA.nav.openCoWebSite("https:\/\/valdotr.github.io\/veepee-quest-map\/src\/assets\/game\/RIDDLE-5-SQUARE-COUNT-GAME-IN-BELGIUM-BRUSSELS-MENNKENPIS-ITEM.pdf").then(() => closePopup()),
            },
        ]
    },
    teleportCyber: {
        message: "Attention, zone de téléportation !",
        buttons: [
            {
                label: "GO!",
                className: "primary",
                callback: () => WA.nav.goToRoom("/@/veepee/brief-virtual-office/vp-quest"),
            }
        ]
    },
    crackTheCodeDusseldorf: {
        message: "Congrats, you just found the cartwheels, click to discover the riddle of the lock 3",
        buttons: [
            {
                label: declineGameText,
                className: "normal",
                callback: () => closePopup(),
            },
            {
                label: acceptGameText,
                className: "primary",
                callback: () => WA.nav.openCoWebSite("https:\/\/valdotr.github.io\/veepee-quest-map\/src\/assets\/game\/RIDDLE-3-CROSSWORD-GAME-IN-GERMANY-CARTWHEELS-ITEM.pdf").then(() => closePopup()),
            },
        ]
    },
    crackTheCodeLausanne: {
        message: "Congrats, you just found the chocolate, click to discover the riddle of the lock 9",
        buttons: [
            {
                label: declineGameText,
                className: "normal",
                callback: () => closePopup(),
            },
            {
                label: acceptGameText,
                className: "primary",
                callback: () => WA.nav.openCoWebSite("https:\/\/valdotr.github.io\/veepee-quest-map\/src\/assets\/game\/RIDDLE-9-FILL-IN-THE-BLANK-GAME-IN-ZWITZERLAND-LAUSANNE-CHOCOLAT-ITEM.pdf").then(() => closePopup()),
            },
        ]
    },
    crackTheCodeMilan: {
        message: "Congrats, you just found the football balloon, click to discover the riddle of the lock 8",
        buttons: [
            {
                label: declineGameText,
                className: "normal",
                callback: () => closePopup(),
            },
            {
                label: acceptGameText,
                className: "primary",
                callback: () => WA.nav.openCoWebSite("https:\/\/valdotr.github.io\/veepee-quest-map\/src\/assets\/game\/RIDDLE-8-GUESS-THE-PLACE-IN-ITALY-MILAN-FOOTBALL-BALLOON-ITEM.pdf").then(() => closePopup()),
            },
        ]
    },
    crackTheCodeTelaviv: {
        message: "Congrats, you just found the skateboard, click to discover the riddle of the lock 6",
        buttons: [
            {
                label: declineGameText,
                className: "normal",
                callback: () => closePopup(),
            },
            {
                label: acceptGameText,
                className: "primary",
                callback: () => WA.nav.openCoWebSite("https:\/\/valdotr.github.io\/veepee-quest-map\/src\/assets\/game\/RIDDLE-6-CRACK-THE-4-DIGITS-IN-ISRAEL-CRACK-THE-4-DIGIT-IN-ISRAEL-TEL-AVIV-SKETEBOARD-ITEM.pdf").then(() => closePopup()),
            },
        ]
    },
    crackTheCodeVerone: {
        message: "Congrats, you just found the macaron, click to discover the riddle of the lock 1",
        buttons: [
            {
                label: declineGameText,
                className: "normal",
                callback: () => closePopup(),
            },
            {
                label: acceptGameText,
                className: "primary",
                callback: () => WA.nav.openCoWebSite("https:\/\/valdotr.github.io\/veepee-quest-map\/src\/assets\/game\/RIDDLE-1-A-MAZE-(TH)ING-GAME-IN-FRANCE-MACARON-ITEM.pdf").then(() => closePopup()),
            },
        ]
    },
    crackTheCodeWarsaw: {
        message: "Congrats, you just found the pierogi, click to discover the riddle of the lock 7",
        buttons: [
            {
                label: declineGameText,
                className: "normal",
                callback: () => closePopup(),
            },
            {
                label: acceptGameText,
                className: "primary",
                callback: () => WA.nav.openCoWebSite("https:\/\/valdotr.github.io\/veepee-quest-map\/src\/assets\/game\/RIDDLE-7-REBUS-GAME-IN-POLAND-WARSAW-FOLKLORIC-DOLL-ITEM.pdf").then(() => closePopup()),
            },
        ]
    },
};

// Olympiad
const IFRAME_HEIGHT = 253;
const IFRAME_WIDTH = 294;
const IFRAME_X = 962;
const IFRAME_Y = 38;

// Waiting for the API to be ready
WA.onInit().then(() => {
    console.log("Scripting API ready");
    console.log("Player tags: ", WA.player.tags)

    // Prepare the teleportation
    WA.room.onEnterLayer("teleportationZone").subscribe(teleportPlayer);

    // Activate Easter egg
    WA.room.onEnterLayer("easterEggZone").subscribe(toggleEaster);
    openPopup("easterEgg");
    setTimeout(() => closePopup(), 5000);

    // Hide labyrinthe layer
    WA.room.hideLayer("secretZoneWalls");

    // Hide final layers
    WA.room.hideLayer("throneLayer");
    WA.room.hideLayer("kingDuckLayer");

    // Open or close popups
    for (let name of Object.keys(config)) {
        // We assume that each popup and zone have a name in common + "Popup" for popups and + "Zone" for layers.
        const layerName = name + "Zone"
        if (name !== "easterEgg")
            WA.room.onEnterLayer(layerName).subscribe(() => { openPopup(name) });
        WA.room.onLeaveLayer(layerName).subscribe(() => {
            closePopup()
            WA.nav.closeCoWebSite();
        })
    }

    // Olympiad
    const createNewEmbedWebsite = (cinemaScreenVariable: string) => {
        WA.room.website.get("cinemaScreen").then((holdWebsite) => {
            WA.room.website.create({
                name: holdWebsite && holdWebsite.name ? holdWebsite.name : "cinemaScreen",
                url: cinemaScreenVariable,
                position: {
                    height: holdWebsite && holdWebsite.height ? holdWebsite.height : IFRAME_HEIGHT,
                    width: holdWebsite && holdWebsite.width ? holdWebsite.width : IFRAME_WIDTH,
                    x: holdWebsite && holdWebsite.x ? holdWebsite.x : IFRAME_X,
                    y: holdWebsite && holdWebsite.y ? holdWebsite.y : IFRAME_Y,
                },
                visible: holdWebsite && holdWebsite.visible ? holdWebsite.visible : true,
                allowApi: true,
                allow: "fullscreen",
            } as any);

            WA.room.website.delete("cinemaScreen");
        }).catch((err) => {
            WA.room.website.create({
                name: "cinemaScreen",
                url: cinemaScreenVariable,
                position: {
                    height: IFRAME_HEIGHT,
                    width: IFRAME_WIDTH,
                    x: IFRAME_X,
                    y: IFRAME_Y,
                },
                visible: true,
                allowApi: true,
                allow: "fullscreen",
            });
        });
    }


    const cinemaScreenVariable = WA.state.loadVariable("cinemaScreenVariable");
    if (cinemaScreenVariable !== undefined) {
        createNewEmbedWebsite(cinemaScreenVariable as string);
    }

    WA.state.onVariableChange("cinemaScreenVariable").subscribe((cinemaScreenVariable: unknown) => {
        if (cinemaScreenVariable === undefined) {
            return;
        }
        createNewEmbedWebsite(cinemaScreenVariable as string);
    });

    // The line below bootstraps the Scripting API Extra library that adds a number of advanced properties/features
    bootstrapExtra().then(() => {
        console.log("Scripting API Extra ready");
    }).catch(e => console.error(e));

}).catch(e => console.error(e));

// Popup management functions
function openPopup(name: string) {
    const popupName = name + "Popup"
    currentPopup = WA.ui.openPopup(popupName, config[name].message, config[name].buttons)
}
function closePopup() {
    if (typeof currentPopup !== "undefined") {
        currentPopup.close();
        currentPopup = undefined;
    }
}