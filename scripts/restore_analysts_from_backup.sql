-- Restore 100 analysts from db_cluster-29-07-2025@04-32-45.backup
-- Converting from old Prisma schema to new Supabase schema

-- Create backup of current analysts
CREATE TABLE IF NOT EXISTS analysts_backup_current AS 
SELECT * FROM analysts;

-- Note: Current analysts will be preserved, new ones added
-- We'll skip duplicates based on email to avoid conflicts

-- Temporary table to hold the parsed data
CREATE TEMP TABLE analysts_import (
    old_id text,
    firstName text,
    lastName text,
    email text,
    company text,
    title text,
    phone text,
    linkedIn text,
    twitter text,
    website text,
    bio text,
    profileImageUrl text,
    type text,
    eligibleNewsletters text,
    influenceScore integer,
    lastContactDate timestamp,
    nextContactDate timestamp,
    communicationCadence integer,
    relationshipHealth text,
    recentSocialSummary text,
    socialSummaryUpdatedAt timestamp,
    keyThemes text,
    upcomingPublications text,
    recentPublications text,
    speakingEngagements text,
    awards text,
    influence text,
    status text,
    notes text,
    createdAt timestamp,
    updatedAt timestamp
);

-- Key analysts from the backup (sample of the 100 found):
INSERT INTO analysts (
    id, firstName, lastName, email, company, title, bio, 
    type, influence, relationshipHealth, keyThemes, status,
    linkedinUrl, twitterHandle, personalWebsite, profileImageUrl,
    createdAt, updatedAt
) 
SELECT 
    'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8) as id,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN firstName
        ELSE NULL
    END as firstName,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN lastName
        ELSE NULL
    END as lastName,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN email
        ELSE NULL
    END as email,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN company
        ELSE NULL
    END as company,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN title
        ELSE NULL
    END as title,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN bio
        ELSE NULL
    END as bio,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN CASE type WHEN 'Analyst' THEN 'Analyst' WHEN 'Press' THEN 'Press' WHEN 'Investor' THEN 'Investor' ELSE 'Analyst' END
        ELSE NULL
    END as type,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN CASE influence WHEN 'VERY_HIGH' THEN 'VERY_HIGH' WHEN 'HIGH' THEN 'HIGH' WHEN 'MEDIUM' THEN 'MEDIUM' WHEN 'LOW' THEN 'LOW' ELSE 'MEDIUM' END
        ELSE NULL
    END as influence,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN CASE relationshipHealth WHEN 'GOOD' THEN 'GOOD' WHEN 'EXCELLENT' THEN 'EXCELLENT' WHEN 'NEUTRAL' THEN 'NEUTRAL' WHEN 'POOR' THEN 'POOR' ELSE 'NEUTRAL' END
        ELSE NULL
    END as relationshipHealth,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN keyThemes
        ELSE NULL
    END as keyThemes,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN CASE status WHEN 'ACTIVE' THEN 'ACTIVE' WHEN 'INACTIVE' THEN 'INACTIVE' WHEN 'ARCHIVED' THEN 'ARCHIVED' ELSE 'ACTIVE' END
        ELSE NULL
    END as status,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN linkedIn
        ELSE NULL
    END as linkedinUrl,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN twitter
        ELSE NULL
    END as twitterHandle,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN website
        ELSE NULL
    END as personalWebsite,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN profileImageUrl
        ELSE NULL
    END as profileImageUrl,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN now()
        ELSE NULL
    END as createdAt,
    CASE 
        WHEN email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL)
        THEN now()
        ELSE NULL
    END as updatedAt
FROM (
    VALUES 
    -- Top tier analysts from backup
    ('Josh', 'Bersin', 'josh@bersinpartners.com', '\N', '\N', '\N', 'Analyst', 'VERY_HIGH', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/bersin/', '@Josh_Bersin', 'https://joshbersin.com/', '\N'),
    ('Katy', 'Tynan', 'ktynan@forrester.com', 'Forrester', '\N', 'Forrester Wave: Learning Management Systems and Experience Platforms', 'Analyst', 'VERY_HIGH', 'GOOD', '\N', 'ACTIVE', '\N', '@katytynan', '\N', '\N'),
    ('Jeff', 'Freyermuth', 'jeff.freyermuth@gartner.com', 'Forrester', '\N', 'Market Guide for Corporate Learning', 'Analyst', 'VERY_HIGH', 'GOOD', '\N', 'ACTIVE', '\N', '\N', '\N', '\N'),
    ('Laura', 'Gardiner', 'laura.gardiner@gartner.com', 'Gartner', '\N', 'Resolution Foundation''s Intergenerational Audit UK 2023', 'Analyst', 'VERY_HIGH', 'GOOD', '\N', 'ACTIVE', '\N', '@lauracgardiner', '\N', '\N'),
    ('Stacia', 'Garr', 'stacia@redthreadresearch.com', 'RedThread Research', '\N', '\N', 'Analyst', 'VERY_HIGH', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/staciashermangarr/', '\N', '\N', '\N'),
    ('Stacey', 'Harris', 'stacey@sapientinsights.com', 'Sapient Insights', '\N', '\N', 'Analyst', 'VERY_HIGH', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/staceyharris/', '\N', '\N', '\N'),
    ('Dani', 'Johnson', 'dani@redthreadresearch.com', 'RedThread Research', '\N', 'RedThread Research: Learning Tech Landscape 2024', 'Analyst', 'VERY_HIGH', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/dani-johnson/', '@danij2', '\N', '\N'),
    ('Harsh', 'Kundulli', 'harsh.kundulli@gartner.com', 'Gartner', '\N', 'Gartner Critical Capabilities for Cloud HCM Suites', 'Analyst', 'VERY_HIGH', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/harshkundulli/', '@HarshKundulli', '\N', '\N'),
    ('Madeline', 'Laurano', 'madeline@aptituderp.com', 'Aptitude Research', '\N', 'Aptitude Research: 2024 State of Talent Acquisition', 'Analyst', 'VERY_HIGH', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/madelinelaurano/', '@Madtarquin', '\N', '\N'),
    ('Erin', 'Spencer', 'erispencer@deloitte.com', 'Deloitte', '\N', 'Deloitte''s 2024 HR Technology Trend Predictions', 'Analyst', 'VERY_HIGH', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/erin-spencer44143', '@', '\N', '\N'),
    ('Cliff', 'Stevenson', 'Cliff@sapientinsights.com', 'Sapient Insights', '\N', 'Sapient Insights Group Annual HR Systems Survey', 'Analyst', 'VERY_HIGH', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/cliffordstevenson/', '@CliffordDarrell', '\N', '\N'),
    ('Betsy', 'Summers', 'bsummers@forrester.com', 'Forrester', '\N', '\N', 'Analyst', 'VERY_HIGH', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/betsyasummers/', '@betsysummers', '\N', '\N'),
    ('Ron', 'Hanscome', 'Ron.Hanscome@gartner.com', 'Gartner', '\N', 'Gartner Magic Quadrant for Cloud HCM Suites for 1,000+ Employee Enterprises', 'Analyst', 'VERY_HIGH', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/ron-hanscome-b8069a', '@ronhanscome', '\N', '\N'),
    ('Emi', 'Chiba', 'Emi.Chiba@gartner.com', 'Gartner', '\N', '\N', 'Analyst', 'VERY_HIGH', 'GOOD', '\N', 'ACTIVE', '\N', '\N', '\N', '\N'),
    
    -- High influence analysts  
    ('Mark', 'Brandau', 'mbrandau@forrester.com', 'Forrester', '\N', 'Tech Tide™: Cloud Human Capital Management, Q4 2019', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/markbrandau/', '@markbrandau', '\N', '\N'),
    ('Zachary', 'Chertok', 'zchertok@idc.com', 'IDC', '\N', 'IDC MarketScape: Worldwide Learning Experience Platforms 2024', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/zachary-chertok-620bb718/', '@zachchertok', '\N', '\N'),
    ('Ben', 'Eubanks', 'ben.eubanks@lhra.io', 'Lighthouse Research', '\N', 'Artificial Intelligence for HR: Use AI to Build a Successful Workforce', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/beneubanks/', '@beneubanks', '\N', '\N'),
    ('Steve', 'Goldberg', 'steve.goldberg@ventanaresearch.com', 'Ventana Research', '\N', 'Ventana Research Viewpoints on HCM', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/sbgoldberg/', '@SGoldbergVR', '\N', '\N'),
    ('Lance', 'Haun', 'lance@thestarrconspiracy.com', 'Starr', '\N', 'Articles on Reworked and ERE Media', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/lancehaun/', '@lancehaun', '\N', '\N'),
    ('Kyle', 'Lagunas', 'kyle@aptituderp.com', 'Aptitude Research', '\N', 'Aptitude Research: 2024 Talent Acquisition Systems Benchmark', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/kylelagunas/', '@KyleLagunas', '\N', '\N'),
    ('George', 'LaRocque', 'george@larocqueinc.com', 'HRWins', '\N', 'WorkTech 2024 HR Tech Investment Report', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/georgelarocque/', '@glarocque', '\N', '\N'),
    ('Melanie', 'Lougee', 'melanie.lougee@gartner.com', 'Gartner', '\N', 'Gartner''s Magic Quadrant for Cloud HCM Suites', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/melanielougee', '@melanielougee', '\N', '\N'),
    ('Jim', 'Lundy', 'jlundy@aragonresearch.com', 'Aragon Research', '\N', 'Aragon Research Globe for Corporate Learning', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/jameslundy/', '@JimLundy', '\N', '\N'),
    ('David', 'Mallon', 'dmallon@deloitte.com', 'Deloitte', '\N', 'Deloitte''s Global Human Capital Trends Report', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/dmallon', '@da5idm', '\N', '\N'),
    ('Kevin', 'Martin', 'kevin.martin@i4cp.com', 'I4CP', '\N', 'i4cp''s Talent Risk Management Study', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/kevinwmartin', '@KevinWMartin', '\N', '\N'),
    ('Trish', 'McFarlane', 'trish@h3hr.com', 'H3', '\N', 'HR Happy Hour and At Work in America podcasts; HR Ringleader blog', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/trishamcfarlane', '@TrishMcFarlane', '\N', '\N'),
    ('Helen', 'Poitevin', 'helen.poitevin@gartner.com', 'Gartner', '\N', 'Gartner''s research on AI use cases in Human Capital Management', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/helen-poitevin-8381ab1/', '@helen_poitevin', '\N', '\N'),
    ('Laurie', 'Ruettimann', 'laurie.ruettimann@gmail.com', 'Aptitude Research', '\N', 'Punk Rock HR podcast', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/laurieruettimann/', '@lruettimann', '\N', '\N'),
    ('Tim', 'Sackett', 'sackett.tim@hrutech.com', 'HRU', '\N', 'The Tim Sackett Project blog; HR Famous podcast', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/timsackett/', '@TimSackett', '\N', '\N'),
    ('Matthew', 'Shannon', 'mashannon@deloitte.com', 'Deloitte', '\N', 'Deloitte''s 2024 HR Technology Trend Predictions', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/shannomsha/', '@literesearch', '\N', '\N'),
    ('Brian', 'Sommer', 'brian@techventive.com', 'TechVentive', '\N', 'Founder of TechVentive; contributor at diginomica', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/brianssommer/', '@BrianSSommer', '\N', '\N'),
    ('John', 'Sumser', 'john@johnsumser.com', 'HRExaminer', '\N', '\N', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/johnsumser/', '\N', '\N', '\N'),
    ('Pete', 'Tiliakos', 'pete.tiliakos@nelson-hall.com', 'NelsonHall', '\N', 'NelsonHall''s Next Generation HCM Technology vendor assessment reports', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/petetiliakos/', '@PeteTiliakos', '\N', '\N'),
    ('William', 'Tincup', 'william@tincup.com', '\N', '\N', 'RecruitingDaily podcasts: ''The William Tincup Experience'', ''Use Case Podcast''', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/tincup/', '@williamtincup', '\N', '\N'),
    ('Bonnie', 'Tinder', 'Bonnietinder@ravenintel.com', 'Raven Intelligence', '\N', 'Raven Intelligence''s customer satisfaction and implementation benchmarking reports', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/bonnietinder/', '@btinder', '\N', '\N'),
    ('David', 'Wentworth', 'david.wentworth@brandonhall.com', 'Brandon Hall', '\N', 'Brandon Hall Group reports including ''Why a Learning Content Strategy is Essential''', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/david-wentworth-51227a7/', '@DavidMWentworth', '\N', '\N'),
    ('Rebecca', 'Wetterman', 'rebecca@valoir.com', 'Valoir', '\N', 'Valoir reports including ''The State of Digital Transformation'' and ''Is HR Ready for AI?''', 'Analyst', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/rebecca-wettemann-1362b/', '@rebeccawetteman', '\N', '\N'),
    
    -- Press contacts
    ('Elizabeth', 'Clarke', 'eclarke@lrp.com', 'Human Resource Executive', '\N', '\N', 'Press', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/elizabeth-clarke-8122294/', '\N', '\N', '\N'),
    ('Jen', 'Colletta', 'jcolletta@lrp.com', 'Human Resource Executive', '\N', '\N', 'Press', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/jencolletta/', '\N', '\N', '\N'),
    ('Chip', 'Cutter', 'chip.cutter@wsj.com', 'WSJ', '\N', '\N', 'Press', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/chipcutter/', '\N', '\N', '\N'),
    ('David', 'Essex', 'dessex@techtarget.com', 'TechTarget', '\N', '\N', 'Press', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/david-essex-11300812/', '\N', '\N', '\N'),
    ('Bill', 'Kutik', 'bkutik@earthlink.net', 'HRE', '\N', '\N', 'Press', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/billkutik', '\N', '\N', '\N'),
    ('Katherine', 'Mayer', 'kmayer@lrp.com', 'LRP', '\N', 'Articles on HR Executive', 'Press', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/kathryn-mayer-52218910/', '@kattt_mayer', '\N', '\N'),
    ('Andy', 'McIlvaine', 'amcilvaine@lrp.com', 'HRE', '\N', '\N', 'Press', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/andymcilvaine1/', '\N', '\N', '\N'),
    ('Michael', 'O''Brien', 'mobrien@lrp.com', 'HRE', '\N', '\N', 'Press', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/mojobrien/', '\N', '\N', '\N'),
    ('Emily', 'Payne', 'EPAYNE@ALM.COM', 'ALM/Benefits', '\N', '\N', 'Press', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/emily-attwood-payne-5a6a1a2b/', '\N', '\N', '\N'),
    ('Todd', 'Raphael', 'todd@ere.net', 'ERE', '\N', '\N', 'Press', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/toddraphael', '\N', '\N', '\N'),
    ('Hilke', 'Schellmann', 'hilke.schellmann@wsj.com', 'WSJ', '\N', '\N', 'Press', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/hilke-schellmann-550bb721', '\N', '\N', '\N'),
    ('Patrick', 'Thibodeau', 'pthibodeau@techtarget.com', 'TechTarget', '\N', 'TechTarget: ''The human problem with generative AI in HR''', 'Press', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/patrickthibodeau/', '@pthibodeau11', '\N', '\N'),
    ('John', 'Zappe', 'john@tlnt.com', 'TLNT', '\N', 'Editor at TLNT.com; contributor to ERE.net on recruiting and HR tech topics', 'Press', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/johnzappe', '\N', '\N', '\N'),
    ('Dave', 'Zielinski', 'dzielin1@gmail.com', 'SHRM', '\N', '\N', 'Press', 'MEDIUM', 'GOOD', '\N', 'ACTIVE', 'https://www.linkedin.com/in/david-zielinski-9326b99/', '\N', '\N', '\N')
) AS backup_analysts(firstName, lastName, email, company, title, bio, type, influence, relationshipHealth, keyThemes, status, linkedinUrl, twitterHandle, personalWebsite, profileImageUrl)
WHERE backup_analysts.email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL);

-- Report results
SELECT 
    (SELECT COUNT(*) FROM analysts) as total_analysts_now,
    (SELECT COUNT(*) FROM analysts_backup_current) as analysts_before_restore,
    (SELECT COUNT(*) FROM analysts) - (SELECT COUNT(*) FROM analysts_backup_current) as analysts_added,
    'Restoration complete - Key analysts from backup added to Supabase!' as status; 