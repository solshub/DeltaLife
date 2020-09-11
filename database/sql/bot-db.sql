DROP DATABASE alpha_bot;
CREATE DATABASE alpha_bot CHARACTER SET utf8 COLLATE utf8_general_ci;
USE alpha_bot;

CREATE TABLE info(
	id	int	NOT NULL AUTO_INCREMENT,

	action	varchar(10),

	PRIMARY KEY(id)
);

CREATE TABLE configs(
	id			int			NOT NULL AUTO_INCREMENT,
	server	varchar(20)	NOT NULL,
	
	prefix		varchar(3)	DEFAULT 'd!',
	toggleAll	boolean		DEFAULT true, /* all non-action actions */
	profilePic	boolean		DEFAULT true, /* allow players to show pfp */
	toggleNsfw	boolean		DEFAULT false, /* disallow go to bed action */
	ageLimit	boolean		DEFAULT true, /* sex between ages */
	toggleKill	boolean		DEFAULT true, /* allow to kill others */

	PRIMARY KEY(id, server),
	UNIQUE(server)
);

CREATE TABLE user(
	id		int				NOT NULL AUTO_INCREMENT,

	user 	varchar(20)		NOT NULL,
	sexual	tinyint(2)		DEFAULT 0,
	zodiac	tinyint(2)		NOT NULL,

	creates	tinyint			DEFAULT 0,
	death	tinyint			DEFAULT 0,
	random	tinyint			DEFAULT 0,
	years	tinyint			DEFAULT 0,
	
	rerolls	tinyint(3)		DEFAULT 5,

	alcohol	tinyint			DEFAULT 0,
	drugs	tinyint			DEFAULT 0,
	gamble	tinyint			DEFAULT 0,
	sex		tinyint			DEFAULT 0,
	work	tinyint			DEFAULT 0,
	shop	tinyint			DEFAULT 0,
	sick	tinyint			DEFAULT 0,
	treated	tinyint			DEFAULT 0,
	child	tinyint			DEFAULT 0,

	patreon	timestamp,

	PRIMARY KEY(id, user),
	UNIQUE(user)
);

CREATE TABLE achievs(
	user	int			NOT NULL,
	FOREIGN KEY(user)	REFERENCES user(id),

	deathA		boolean		DEFAULT false,
	deathB		boolean		DEFAULT false,
	deathC		boolean		DEFAULT false,
	deathD		boolean		DEFAULT false,
	yearsA		boolean		DEFAULT false,
	yearsB		boolean		DEFAULT false,
	yearsC		boolean		DEFAULT false,
	yearsD		boolean		DEFAULT false,
	createsA	boolean		DEFAULT false,
	createsB	boolean		DEFAULT false,
	createsC	boolean		DEFAULT false,
	createsD	boolean		DEFAULT false,
	randomA		boolean		DEFAULT false,
	randomB		boolean		DEFAULT false,
	randomC		boolean		DEFAULT false,
	
	sickA		boolean		DEFAULT false,
	sickB		boolean		DEFAULT false,
	sickC		boolean		DEFAULT false,
	treatedA	boolean		DEFAULT false,
	treatedB	boolean		DEFAULT false,
	treatedC	boolean		DEFAULT false,
	childA		boolean		DEFAULT false,
	childB		boolean		DEFAULT false,
	childC		boolean		DEFAULT false,
	
	alcoholA	boolean		DEFAULT false,
	alcoholB	boolean		DEFAULT false,
	alcoholC	boolean		DEFAULT false,
	drugsA		boolean		DEFAULT false,
	drugsB		boolean		DEFAULT false,
	drugsC		boolean		DEFAULT false,
	gambleA		boolean		DEFAULT false,
	gambleB		boolean		DEFAULT false,
	gambleC		boolean		DEFAULT false,
	sexA		boolean		DEFAULT false,
	sexB		boolean		DEFAULT false,
	sexC		boolean		DEFAULT false,
	workA		boolean		DEFAULT false,
	workB		boolean		DEFAULT false,
	workC		boolean		DEFAULT false,
	shopA		boolean		DEFAULT false,
	shopB		boolean		DEFAULT false,
	shopC		boolean		DEFAULT false,

	PRIMARY KEY(user),
	UNIQUE(user)
);

CREATE TABLE reroll(
	id		int			NOT NULL AUTO_INCREMENT,
	user 	int			NOT NULL,
	FOREIGN KEY(user) 	REFERENCES user(id),

	gender	tinyint		NOT NULL,
	country	tinyint		NOT NULL,
	health	tinyint		NOT NULL,
	smarts	tinyint		NOT NULL,
	looks	tinyint		NOT NULL,

	PRIMARY KEY(id, user),
	UNIQUE(user)
);

CREATE TABLE relation(
	id		int			NOT NULL AUTO_INCREMENT,
	userA	int			NOT NULL,
	FOREIGN KEY(userA) 	REFERENCES user(id),
	userB	int			NOT NULL,
	FOREIGN KEY(userB) 	REFERENCES user(id),

	friend	tinyint(3)	DEFAULT 0,
	love	tinyint(3)	DEFAULT 0,
	title	tinyint(2) 	DEFAULT 0,
	met		timestamp	DEFAULT CURRENT_TIMESTAMP,

	PRIMARY KEY(id)
);

CREATE TABLE player(
	id		int				NOT NULL AUTO_INCREMENT,
	user	int				NOT NULL,
	FOREIGN KEY(user) 		REFERENCES user(id),
	marry	int,
	FOREIGN KEY(marry)		REFERENCES player(id),

	alive	boolean			DEFAULT true,
	death	timestamp		NULL,
	active	boolean			DEFAULT true,
	name	varchar(17)		NOT NULL,	
	img		varchar(100),
	birth	timestamp		DEFAULT CURRENT_TIMESTAMP,

	happy	tinyint(3)		DEFAULT 75,
	social	tinyint(3)		DEFAULT 50,
	health	tinyint(3)		NOT NULL,
	smarts	tinyint(3)		NOT NULL,
	looks	tinyint(3)		NOT NULL,

	cash	decimal(15,2)	DEFAULT 0.00,
	age		tinyint(3)		DEFAULT 0,
	gender	tinyint(2)		NOT NULL,
	country	tinyint(2)		NOT NULL,

	dropped	boolean			DEFAULT false,
	retired boolean			DEFAULT false,
	preg	int,
	FOREIGN KEY(preg) 		REFERENCES player(id),	

	PRIMARY KEY(id)
);

CREATE TABLE gamble(
	id				int				NOT NULL AUTO_INCREMENT,
	player			int				NOT NULL,
	FOREIGN KEY(player)				REFERENCES player(id),

	earnSlots		decimal(13, 2)	DEFAULT 0.00,
	earnLottery		decimal(13, 2)	DEFAULT 0.00,
	earnBlackjack	decimal(13, 2)	DEFAULT 0.00,
	earnRoulette	decimal(13, 2)	DEFAULT 0.00,
	earnCraps		decimal(13, 2)	DEFAULT 0.00,

	PRIMARY KEY(id, player)
);

CREATE TABLE lottery(
	id		int				NOT NULL AUTO_INCREMENT,
	winner	int,
	FOREIGN KEY(winner)		REFERENCES player(id),

	lottery	decimal(13, 2)	DEFAULT 100000.00,
	since	timestamp		DEFAULT CURRENT_TIMESTAMP,		
	won		timestamp		NULL,

	PRIMARY KEY(id)
);

CREATE TABLE timeout(
	id 		int 		NOT NULL AUTO_INCREMENT,
	user	int			NOT NULL,
	FOREIGN KEY(USER)	REFERENCES user(id),

	general datetime,

	age		datetime,
	random	datetime,
	drink	datetime,
	drugs 	datetime,
	study	datetime,
	work	datetime,

	PRIMARY KEY(id)
);

CREATE TABLE yearly(
	id			int			NOT NULL AUTO_INCREMENT,
	player		int			NOT NULL,
	FOREIGN KEY(player)		REFERENCES player(id),

	scholarship	boolean		DEFAULT false,
	asking		boolean		DEFAULT false,

	alcohol		tinyint(3)	DEFAULT 0,
	drugs		tinyint(3)	DEFAULT 0,
	gamble		tinyint(3)	DEFAULT 0,
	sex			tinyint(3)	DEFAULT 0,
	study		tinyint(3)	DEFAULT 0,
	work		tinyint(3)	DEFAULT 0,
	shop		tinyint(3)	DEFAULT 0,

	degree1		tinyint(2)	DEFAULT 0,
	degree2		tinyint(2)	DEFAULT 0,
	degree3		tinyint(2)	DEFAULT 0,
	degree4		tinyint(2)	DEFAULT 0,
	degree5		tinyint(2)	DEFAULT 0,

	job1		tinyint(2)	DEFAULT 0,
	job2		tinyint(2)	DEFAULT 0,
	job3		tinyint(2)	DEFAULT 0,
	job4		tinyint(2)	DEFAULT 0,
	job5		tinyint(2)	DEFAULT 0,

	PRIMARY KEY(id),
	UNIQUE(player)
);

CREATE TABLE addict(
	id			int			NOT NULL AUTO_INCREMENT,
	player		int			NOT NULL,
	FOREIGN KEY(player)		REFERENCES player(id),

	alcohol		boolean		DEFAULT false,
	drugs		boolean		DEFAULT false,
	gamble		boolean		DEFAULT false,
	sex			boolean		DEFAULT false,
	study		boolean		DEFAULT false,
	work		boolean		DEFAULT false,
	shop		boolean		DEFAULT false,
	
	PRIMARY KEY(id),
	UNIQUE(player)
);

CREATE TABLE sick(
	id		int			NOT NULL AUTO_INCREMENT,
	player	int			NOT NULL,
	FOREIGN KEY(player)	REFERENCES player(id),

	sick	tinyint(2)	NOT NULL,

	PRIMARY KEY(id)
);

CREATE TABLE children(
	id		int				NOT NULL AUTO_INCREMENT,
	parentA	int				NOT NULL,
	FOREIGN KEY(parentA)	REFERENCES player(id),
	parentB	int				NOT NULL,
	FOREIGN KEY(parentB)	REFERENCES player(id),

	name	varchar(20) 	NOT NULL,
	gender	tinyint(2)		NOT NULL,
	birth	timestamp		DEFAULT CURRENT_TIMESTAMP,
	age		tinyint(3)		DEFAULT 0,
	img		varchar(100),
	cost 	decimal(9,2)	DEFAULT 0.00,

	PRIMARY KEY(id)
);

CREATE TABLE degree(
	id		int				NOT NULL AUTO_INCREMENT,
	player	int				NOT NULL,
	FOREIGN KEY(player)		REFERENCES player(id),
	degree	int(2)			NOT NULL DEFAULT 0,
	
	grade	varchar(2)		DEFAULT 'F',
	years	tinyint(2)		DEFAULT 0,
	score	tinyint(3)		DEFAULT 0,
	loan	decimal(9,2)	DEFAULT 0.00,
	paidin	tinyint(3)		DEFAULT 0,

	PRIMARY KEY(id),
	UNIQUE(player)
);

CREATE TABLE job(
	id		int				NOT NULL AUTO_INCREMENT,
	player	int				NOT NULL,
	FOREIGN KEY(player) 	REFERENCES player(id),
	job		int(2)			NOT NULL DEFAULT 0,

	rank	tinyint(1)		DEFAULT 0,
	years	tinyint(2)		DEFAULT 0,
	score	tinyint(3)		DEFAULT 0,
	salary	decimal(9,2)	DEFAULT 0.00,

	PRIMARY KEY(id),
	UNIQUE(player)
);

CREATE TABLE house(
	id		int				NOT NULL AUTO_INCREMENT,
	player	int				NOT NULL,
	FOREIGN KEY(player)		REFERENCES player(id),

	value	decimal(9,2)	NOT NULL,
	baths	tinyint(1)		DEFAULT 1,
	beds	tinyint(1)		DEFAULT 1,
	bought  timestamp		DEFAULT CURRENT_TIMESTAMP,
	img		varchar(100),
	loan	decimal(9,2)	DEFAULT 0.00,
	paidin	tinyint(3)		DEFAULT 0,

	PRIMARY KEY(id)
);

CREATE TABLE car(
	id		int				NOT NULL AUTO_INCREMENT,
	player	int				NOT NULL,
	FOREIGN KEY(player)		REFERENCES player(id),
	
	value	decimal(9,2)	NOT NULL,
	img		varchar(100),
	loan	decimal(9,2)	DEFAULT 0.00,
	paidin	tinyint(3)		DEFAULT 0,

	PRIMARY KEY(id)
);

/*
INSERT INTO user(user, zodiac, patreon)
	VALUES ('681224613274845252', 1, true),
		('315991714223620097', 2, true),
		('144262363175059456', 3, true);

INSERT INTO player(user, gender, country, age, name, social, health, smarts, looks, cash)
	VALUES (1, 1, 1, 0, 'Bot', 80, 80, 80, 80, 5000.00),
		(2, 2, 1, 18, 'Jig', 80, 80, 100, 100, 5000.00),
		(3, 1, 43, 0, 'Gabriel', 100, 100, 100, 100, 1000.00);

INSERT INTO job(player, job)
	VALUES (2, 0);

INSERT INTO degree(player, degree, years)
	VALUES (2, 4, 4);
*/

/*
INSERT INTO children(parentA, parentB, name, gender, cost)
	VALUES (1, 2, 'Child', 1, 1000.00);
*/

/*
INSERT INTO house(player, value, loan, paidin)
	VALUES (2, 100.00, 0, 0),
		(2, 100.50, 50.0, 3);

INSERT INTO car(player, value, loan, paidin)
	VALUES (2, 100.00, 0, 0),
		(2, 100.50, 50.5, 12);
*/