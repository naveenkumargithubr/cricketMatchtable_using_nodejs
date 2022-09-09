const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbpath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayerDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};
const convertMatchScoreObjectToResponseObject = (dbObject) => {
  return {
    playerMatchId: dbObject.player_match_id,
    playerId: dbObject.player_id,
    matchId: dbObject.match_id,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};

//get all the players
app.get("/players/", async (request, response) => {
  const getPlayerQuery = `
    SELECT
      *
    FROM
      player_details;`;
  const playersArray = await db.all(getPlayerQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjectToResponseObject(eachPlayer)
    )
  );
});

//get a specific player id
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getSpecific_id = `
           SELECT
             * 
           FROM 
             player_details
           WHERE 
            player_id = ${playerId};`;
  const specificid = await db.get(getSpecific_id);
  response.send(convertPlayerDbObjectToResponseObject(specificid));
});

//update the data
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateplayertable = `UPDATE
                   player_details
                SET 
                   player_name ='${playerName}'
                WHERE 
                   player_id = ${playerId};`;
  const updatingName = await db.run(updateplayertable);
  response.send("Player Details Updated");
});

// Returns the match details of a specific match

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getthematchDetails = `
         SELECT 
           *
         FROM 
           match_details
        WHERE 
          match_id = ${matchId} 
    `;
  const matchdetails = await db.get(getthematchDetails);
  response.send(convertMatchObjectToResponseObject(matchdetails));
});

// Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getallthematches = `
          SELECT 
            match_id As matchId,
            match,
            year
          FROM 
            match_details
          NATURAL JOIN 
            Player_match_score
          WHERE 
            player_id = ${playerId}`;
  const allmatches = await db.all(getallthematches);
  response.send(allmatches);
});

//Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `
        SELECT 
            player_id AS playerId,
            player_name AS playerName
        FROM  
            player_match_score NATURAL JOIN player_details
        WHERE 
            match_id=${matchId};`;
  const players = await db.all(getPlayerQuery);
  response.send(players);
});

//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
  SELECT player_id,player_name,SUM(score),SUM(fours),SUM(sixes)
  FROM  player_match_score NATURAL JOIN player_details
  WHERE player_id=${playerId};`;
  const playerScores = await db.get(getPlayerQuery);
  response.send({
    playerId: playerScores["player_id"],
    playerName: playerScores["player_name"],
    totalScore: playerScores["SUM(score)"],
    totalFours: playerScores["SUM(fours)"],
    totalSixes: playerScores["SUM(sixes)"],
  });
});

module.exports = app;
