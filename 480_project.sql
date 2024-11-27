DROP DATABASE IF EXISTS 480_project;
CREATE DATABASE 480_project;
USE 480_project;

-- DDL section

CREATE TABLE Owner (
    Email VARCHAR(255) PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Phone VARCHAR(15),
    Password VARCHAR(255) NOT NULL,
    IdentificationDetails TEXT
);

CREATE TABLE Client (
    Email VARCHAR(255) PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    Age INT NOT NULL,
    Phone VARCHAR(15),
    Password VARCHAR(255) NOT NULL,
    DrivingLicenseNumber VARCHAR(50) NOT NULL,
    IdentificationDetails TEXT
);

CREATE TABLE Car (
    VIN VARCHAR(50) PRIMARY KEY,
    Make VARCHAR(255) NOT NULL,
    Model VARCHAR(255) NOT NULL,
    Year INT NOT NULL,
    LicensePlate VARCHAR(50) NOT NULL UNIQUE,
    DailyPrice DECIMAL(10, 2) NOT NULL,
    OwnerEmail VARCHAR(255) NOT NULL,
    FOREIGN KEY (OwnerEmail) REFERENCES Owner(Email)
);

CREATE TABLE Rental (
    VIN VARCHAR(50) NOT NULL,
    ClientEmail VARCHAR(255) NOT NULL,
    StartDate DATE NOT NULL,
    EndDate DATE,
    PRIMARY KEY (VIN, ClientEmail, StartDate),
    FOREIGN KEY (VIN) REFERENCES Car(VIN),
    FOREIGN KEY (ClientEmail) REFERENCES Client(Email)
);

-- DML section:

--OWNER
--car insertion
INSERT INTO Car (VIN, Make, Model, Year, LicensePlate, DailyPrice, OwnerEmail)
VALUES (:vin, :make, :model, :year, :license_plate, :daily_price, :owner_email);

--CLIENT
--searching
SELECT *
FROM Car
WHERE VIN NOT IN (
    SELECT VIN
    FROM Rental
    WHERE NOT (
        :endDate < StartDate OR :startDate > EndDate
    )
);
--renting
SELECT VIN
FROM Rental
WHERE VIN = :vin AND NOT (:endDate < StartDate OR :startDate > EndDate);

INSERT INTO Rental (VIN, ClientEmail, StartDate, EndDate)
VALUES (:vin, :clientEmail, :startDate, :endDate);

--calculate rental fee for client
SELECT
    DailyPrice * (JULIANDAY(:endDate) - JULIANDAY(:startDate)) AS RentalFee --JULIANDAY is a SQLite function that converts a date or timestamp into a Julian day number, which is a continuous count of days since a fixed starting point in time
FROM Car
WHERE VIN = :vin;




-- Trigger 

CREATE TRIGGER CheckCarExists
BEFORE INSERT OR UPDATE ON Rental
FOR EACH ROW
DECLARE
    car_count INT;
BEGIN
    -- Check if the VIN associated with the rental exists in the Car table
    SELECT COUNT(*) INTO car_count
    FROM Car
    WHERE VIN = :NEW.VIN;

    IF car_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'The specified car (VIN) does not exist in the Car table.');
    END IF;
END;
/

CREATE TRIGGER CheckClientExists
BEFORE INSERT OR UPDATE ON Rental
FOR EACH ROW
DECLARE
    client_count INT;
BEGIN
    -- Check if the ClientEmail associated with the rental exists in the Client table
    SELECT COUNT(*) INTO client_count
    FROM Client
    WHERE Email = :NEW.ClientEmail;

    IF client_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20002, 'The specified client does not exist in the Client table.');
    END IF;
END;
/


CREATE TRIGGER CheckReservationDates
BEFORE INSERT OR UPDATE ON Rental
FOR EACH ROW
BEGIN
    -- Ensure that EndDate is later than StartDate
    IF :NEW.EndDate <= :NEW.StartDate THEN
        RAISE_APPLICATION_ERROR(-20003, 'EndDate must be later than StartDate.');
    END IF;
END;
/


CREATE TRIGGER CheckOverlappingReservations
BEFORE INSERT OR UPDATE ON Rental
FOR EACH ROW
DECLARE
    overlap_count INT;
BEGIN
    -- Check for overlapping reservations for the same car
    SELECT COUNT(*) INTO overlap_count
    FROM Rental
    WHERE VIN = :NEW.VIN
      AND (
          -- New reservation starts during an existing reservation
          (:NEW.StartDate BETWEEN StartDate AND EndDate) OR
          -- New reservation ends during an existing reservation
          (:NEW.EndDate BETWEEN StartDate AND EndDate) OR
          -- New reservation fully overlaps an existing reservation
          (:NEW.StartDate <= StartDate AND :NEW.EndDate >= EndDate)
      )
      AND (StartDate != :NEW.StartDate OR EndDate != :NEW.EndDate); -- Ignore the same row in updates

    IF overlap_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20004, 'Reservation dates overlap with an existing reservation for the same car.');
    END IF;
END;
/
