-- Drop tables if they exist
DROP TABLE IF EXISTS Rental;
DROP TABLE IF EXISTS Car;
DROP TABLE IF EXISTS Client;
DROP TABLE IF EXISTS Owner;

-- DDL section

CREATE TABLE Owner (
    Email TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    Phone TEXT,
    Password TEXT NOT NULL,
    IdentificationDetails TEXT
);

CREATE TABLE Client (
    Email TEXT PRIMARY KEY,
    Name TEXT NOT NULL,
    Age INTEGER NOT NULL,
    Phone TEXT,
    Password TEXT NOT NULL,
    DrivingLicenseNumber TEXT NOT NULL,
    IdentificationDetails TEXT
);

CREATE TABLE Car (
    VIN TEXT PRIMARY KEY,
    Make TEXT NOT NULL,
    Model TEXT NOT NULL,
    Year INTEGER NOT NULL,
    LicensePlate TEXT NOT NULL UNIQUE,
    DailyPrice REAL NOT NULL,
    OwnerEmail TEXT NOT NULL,
    FOREIGN KEY (OwnerEmail) REFERENCES Owner(Email)
);

CREATE TABLE Rental (
    VIN TEXT NOT NULL,
    ClientEmail TEXT NOT NULL,
    StartDate TEXT NOT NULL,
    EndDate TEXT NOT NULL,
    PRIMARY KEY (VIN, ClientEmail, StartDate),
    FOREIGN KEY (VIN) REFERENCES Car(VIN),
    FOREIGN KEY (ClientEmail) REFERENCES Client(Email)
);

-- Triggers are optional in SQLite but can be added if necessary.
-- For simplicity, we'll handle constraints in application logic.


-- -- -- DML section:

-- -- --OWNER
-- -- --car insertion
-- -- INSERT INTO Car (VIN, Make, Model, Year, LicensePlate, DailyPrice, OwnerEmail)
-- -- VALUES (:vin, :make, :model, :year, :license_plate, :daily_price, :owner_email);

-- -- --CLIENT
-- -- --searching
-- -- SELECT *
-- -- FROM Car
-- -- WHERE VIN NOT IN (
-- --     SELECT VIN
-- --     FROM Rental
-- --     WHERE NOT (
-- --         :endDate < StartDate OR :startDate > EndDate
-- --     )
-- -- );
-- -- --renting
-- -- SELECT VIN
-- -- FROM Rental
-- -- WHERE VIN = :vin AND NOT (:endDate < StartDate OR :startDate > EndDate);

-- -- INSERT INTO Rental (VIN, ClientEmail, StartDate, EndDate)
-- -- VALUES (:vin, :clientEmail, :startDate, :endDate);

-- -- --calculate rental fee for client
-- -- SELECT
-- --     DailyPrice * (JULIANDAY(:endDate) - JULIANDAY(:startDate)) AS RentalFee --JULIANDAY is a SQLite function that converts a date or timestamp into a Julian day number, which is a continuous count of days since a fixed starting point in time
-- -- FROM Car
-- -- WHERE VIN = :vin;




-- DELIMITER $$
 
-- --Checks if the car exists in the Car table before inserting a new rental record
-- CREATE TRIGGER CheckCarExists
-- BEFORE INSERT ON Rental
-- FOR EACH ROW
-- BEGIN
--     IF (SELECT COUNT(*) FROM Car WHERE VIN = NEW.VIN) = 0 THEN
--         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The specified car (VIN) does not exist in the Car table.';
--     END IF;
-- END$$


-- --Checks if the client exists in the Client table before inserting a new rental record
-- CREATE TRIGGER CheckClientExists
-- BEFORE INSERT ON Rental
-- FOR EACH ROW
-- BEGIN
--     IF (SELECT COUNT(*) FROM Client WHERE Email = NEW.ClientEmail) = 0 THEN
--         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'The specified client does not exist in the Client table.';
--     END IF;
-- END$$


-- -- Ensure that EndDate is later than StartDate
-- CREATE TRIGGER CheckReservationDates
-- BEFORE INSERT OR UPDATE ON Rental
-- FOR EACH ROW
-- BEGIN
--     IF NEW.EndDate <= NEW.StartDate THEN
--         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'EndDate must be later than StartDate.';
--     END IF;
-- END$$


-- CREATE TRIGGER CheckOverlappingReservations
-- BEFORE INSERT ON Rental
-- FOR EACH ROW
-- BEGIN
--     DECLARE overlap_count INT;
--     SELECT COUNT(*) INTO overlap_count
--     FROM Rental
--     WHERE VIN = NEW.VIN
--       AND (
--           (NEW.StartDate BETWEEN StartDate AND EndDate) OR
--           (NEW.EndDate BETWEEN StartDate AND EndDate) OR
--           (StartDate BETWEEN NEW.StartDate AND NEW.EndDate)
--       );

--     IF overlap_count > 0 THEN
--         SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Reservation dates overlap with an existing reservation for the same car.';
--     END IF;
-- END$$

-- DELIMITER ;
