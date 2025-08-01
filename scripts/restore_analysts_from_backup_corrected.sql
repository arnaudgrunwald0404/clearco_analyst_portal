-- Restore key analysts from db_cluster-29-07-2025@04-32-45.backup
-- Using correct column names for Supabase schema

-- Create backup of current analysts
CREATE TABLE IF NOT EXISTS analysts_backup_current AS 
SELECT * FROM analysts;

-- Insert top analysts from backup (avoiding duplicates by email)
INSERT INTO analysts (
    id, "firstName", "lastName", email, company, title, bio, 
    type, influence, "relationshipHealth", "keyThemes", status,
    "linkedinUrl", "twitterHandle", "personalWebsite", "profileImageUrl",
    "createdAt", "updatedAt"
) 
SELECT 
    'cl' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8) as id,
    backup_analysts.firstName,
    backup_analysts.lastName,
    backup_analysts.email,
    backup_analysts.company,
    backup_analysts.title,
    backup_analysts.bio,
    backup_analysts.type::analyst_type,
    backup_analysts.influence::influence,
    backup_analysts.relationshipHealth::relationship_health,
    backup_analysts.keyThemes,
    backup_analysts.status::status,
    backup_analysts.linkedinUrl,
    backup_analysts.twitterHandle,
    backup_analysts.personalWebsite,
    backup_analysts.profileImageUrl,
    now() as createdAt,
    now() as updatedAt
FROM (
    VALUES 
    -- Top tier VERY_HIGH influence analysts from backup
    ('Josh', 'Bersin', 'josh@bersinpartners.com', 'Bersin & Associates', 'Founder', 'Leading HR industry analyst and founder of Bersin & Associates', 'Analyst', 'VERY_HIGH', 'GOOD', 'HR Strategy, Learning & Development, AI in HR', 'ACTIVE', 'https://www.linkedin.com/in/bersin/', '@Josh_Bersin', 'https://joshbersin.com/', null),
    ('Katy', 'Tynan', 'ktynan@forrester.com', 'Forrester', 'Principal Analyst', 'Forrester Wave: Learning Management Systems and Experience Platforms', 'Analyst', 'VERY_HIGH', 'GOOD', 'Learning Platforms, LMS', 'ACTIVE', null, '@katytynan', null, null),
    ('Laura', 'Gardiner', 'laura.gardiner@gartner.com', 'Gartner', 'Research VP', 'Resolution Foundation Intergenerational Audit UK 2023', 'Analyst', 'VERY_HIGH', 'GOOD', 'Workforce Demographics, Future of Work', 'ACTIVE', null, '@lauracgardiner', null, null),
    ('Stacia', 'Garr', 'stacia@redthreadresearch.com', 'RedThread Research', 'Principal Analyst', 'RedThread Research founder and principal analyst', 'Analyst', 'VERY_HIGH', 'GOOD', 'People Analytics, HR Technology', 'ACTIVE', 'https://www.linkedin.com/in/staciashermangarr/', null, null, null),
    ('Stacey', 'Harris', 'stacey@sapientinsights.com', 'Sapient Insights', 'Research Director', 'Sapient Insights Group research director', 'Analyst', 'VERY_HIGH', 'GOOD', 'HR Technology, Systems Research', 'ACTIVE', 'https://www.linkedin.com/in/staceyharris/', null, null, null),
    ('Dani', 'Johnson', 'dani@redthreadresearch.com', 'RedThread Research', 'Senior Analyst', 'RedThread Research: Learning Tech Landscape 2024', 'Analyst', 'VERY_HIGH', 'GOOD', 'Learning Technology, Talent Development', 'ACTIVE', 'https://www.linkedin.com/in/dani-johnson/', '@danij2', null, null),
    ('Harsh', 'Kundulli', 'harsh.kundulli@gartner.com', 'Gartner', 'Senior Principal Analyst', 'Gartner Critical Capabilities for Cloud HCM Suites', 'Analyst', 'VERY_HIGH', 'GOOD', 'Cloud HCM, Technology Evaluation', 'ACTIVE', 'https://www.linkedin.com/in/harshkundulli/', '@HarshKundulli', null, null),
    ('Madeline', 'Laurano', 'madeline@aptituderp.com', 'Aptitude Research', 'Chief Analyst', 'Aptitude Research: 2024 State of Talent Acquisition', 'Analyst', 'VERY_HIGH', 'GOOD', 'Talent Acquisition, Recruiting Technology', 'ACTIVE', 'https://www.linkedin.com/in/madelinelaurano/', '@Madtarquin', null, null),
    ('Erin', 'Spencer', 'erispencer@deloitte.com', 'Deloitte', 'Principal', 'Deloitte 2024 HR Technology Trend Predictions', 'Analyst', 'VERY_HIGH', 'GOOD', 'HR Technology Trends, Digital Transformation', 'ACTIVE', 'https://www.linkedin.com/in/erin-spencer44143', null, null, null),
    ('Cliff', 'Stevenson', 'Cliff@sapientinsights.com', 'Sapient Insights', 'Managing Partner', 'Sapient Insights Group Annual HR Systems Survey', 'Analyst', 'VERY_HIGH', 'GOOD', 'HR Systems, Market Research', 'ACTIVE', 'https://www.linkedin.com/in/cliffordstevenson/', '@CliffordDarrell', null, null),
    ('Betsy', 'Summers', 'bsummers@forrester.com', 'Forrester', 'Principal Analyst', 'Forrester principal analyst covering HR technology', 'Analyst', 'VERY_HIGH', 'GOOD', 'HR Technology Strategy', 'ACTIVE', 'https://www.linkedin.com/in/betsyasummers/', '@betsysummers', null, null),
    ('Ron', 'Hanscome', 'Ron.Hanscome@gartner.com', 'Gartner', 'Research VP', 'Gartner Magic Quadrant for Cloud HCM Suites for 1,000+ Employee Enterprises', 'Analyst', 'VERY_HIGH', 'GOOD', 'Enterprise HCM, Cloud Systems', 'ACTIVE', 'https://www.linkedin.com/in/ron-hanscome-b8069a', '@ronhanscome', null, null),
    ('Emi', 'Chiba', 'Emi.Chiba@gartner.com', 'Gartner', 'Senior Principal Analyst', 'Gartner senior principal analyst', 'Analyst', 'VERY_HIGH', 'GOOD', 'HR Technology, Global Markets', 'ACTIVE', null, null, null, null),
    
    -- HIGH influence analysts  
    ('Mark', 'Brandau', 'mbrandau@forrester.com', 'Forrester', 'Principal Analyst', 'Tech Tide: Cloud Human Capital Management Q4 2019', 'Analyst', 'HIGH', 'GOOD', 'Cloud HCM, Technology Assessment', 'ACTIVE', 'https://www.linkedin.com/in/markbrandau/', '@markbrandau', null, null),
    ('Zachary', 'Chertok', 'zchertok@idc.com', 'IDC', 'Research Manager', 'IDC MarketScape: Worldwide Learning Experience Platforms 2024', 'Analyst', 'HIGH', 'GOOD', 'Learning Platforms, EdTech', 'ACTIVE', 'https://www.linkedin.com/in/zachary-chertok-620bb718/', '@zachchertok', null, null),
    ('Ben', 'Eubanks', 'ben.eubanks@lhra.io', 'Lighthouse Research', 'Principal Analyst', 'Artificial Intelligence for HR: Use AI to Build a Successful Workforce', 'Analyst', 'HIGH', 'GOOD', 'AI in HR, People Analytics', 'ACTIVE', 'https://www.linkedin.com/in/beneubanks/', '@beneubanks', null, null),
    ('Steve', 'Goldberg', 'steve.goldberg@ventanaresearch.com', 'Ventana Research', 'Research Director', 'Ventana Research Viewpoints on HCM', 'Analyst', 'HIGH', 'GOOD', 'HCM Technology, Market Analysis', 'ACTIVE', 'https://www.linkedin.com/in/sbgoldberg/', '@SGoldbergVR', null, null),
    ('Lance', 'Haun', 'lance@thestarrconspiracy.com', 'The Starr Conspiracy', 'Analyst', 'Articles on Reworked and ERE Media', 'Analyst', 'HIGH', 'GOOD', 'HR Marketing, Talent Brand', 'ACTIVE', 'https://www.linkedin.com/in/lancehaun/', '@lancehaun', null, null),
    ('Kyle', 'Lagunas', 'kyle@aptituderp.com', 'Aptitude Research', 'Senior Analyst', 'Aptitude Research: 2024 Talent Acquisition Systems Benchmark', 'Analyst', 'HIGH', 'GOOD', 'Talent Acquisition Technology', 'ACTIVE', 'https://www.linkedin.com/in/kylelagunas/', '@KyleLagunas', null, null),
    ('George', 'LaRocque', 'george@larocqueinc.com', 'HRWins', 'Founder', 'WorkTech 2024 HR Tech Investment Report', 'Analyst', 'HIGH', 'GOOD', 'HR Tech Investment, Market Trends', 'ACTIVE', 'https://www.linkedin.com/in/georgelarocque/', '@glarocque', null, null),
    ('Melanie', 'Lougee', 'melanie.lougee@gartner.com', 'Gartner', 'Senior Principal Analyst', 'Gartner Magic Quadrant for Cloud HCM Suites', 'Analyst', 'HIGH', 'GOOD', 'Cloud HCM Suites', 'ACTIVE', 'https://www.linkedin.com/in/melanielougee', '@melanielougee', null, null),
    ('Jim', 'Lundy', 'jlundy@aragonresearch.com', 'Aragon Research', 'CEO', 'Aragon Research Globe for Corporate Learning', 'Analyst', 'HIGH', 'GOOD', 'Corporate Learning, Technology Research', 'ACTIVE', 'https://www.linkedin.com/in/jameslundy/', '@JimLundy', null, null),
    ('David', 'Mallon', 'dmallon@deloitte.com', 'Deloitte', 'Chief Analyst', 'Deloitte Global Human Capital Trends Report', 'Analyst', 'HIGH', 'GOOD', 'Human Capital Trends, Future of Work', 'ACTIVE', 'https://www.linkedin.com/in/dmallon', '@da5idm', null, null),
    ('Kevin', 'Martin', 'kevin.martin@i4cp.com', 'Institute for Corporate Productivity', 'Senior Analyst', 'i4cp Talent Risk Management Study', 'Analyst', 'HIGH', 'GOOD', 'Talent Risk, Corporate Productivity', 'ACTIVE', 'https://www.linkedin.com/in/kevinwmartin', '@KevinWMartin', null, null),
    ('Trish', 'McFarlane', 'trish@h3hr.com', 'H3 HR Advisors', 'Principal Advisor', 'HR Happy Hour and At Work in America podcasts; HR Ringleader blog', 'Analyst', 'HIGH', 'GOOD', 'HR Leadership, Workplace Culture', 'ACTIVE', 'https://www.linkedin.com/in/trishamcfarlane', '@TrishMcFarlane', null, null),
    ('Helen', 'Poitevin', 'helen.poitevin@gartner.com', 'Gartner', 'Research VP', 'Gartner research on AI use cases in Human Capital Management', 'Analyst', 'HIGH', 'GOOD', 'AI in HCM, Technology Innovation', 'ACTIVE', 'https://www.linkedin.com/in/helen-poitevin-8381ab1/', '@helen_poitevin', null, null),
    ('Laurie', 'Ruettimann', 'laurie.ruettimann@gmail.com', 'Punk Rock HR', 'Founder', 'Punk Rock HR podcast host and consultant', 'Analyst', 'HIGH', 'GOOD', 'HR Culture, Leadership', 'ACTIVE', 'https://www.linkedin.com/in/laurieruettimann/', '@lruettimann', null, null),
    ('Tim', 'Sackett', 'sackett.tim@hrutech.com', 'HRU Technical Resources', 'President', 'The Tim Sackett Project blog; HR Famous podcast', 'Analyst', 'HIGH', 'GOOD', 'HR Technology, Recruiting', 'ACTIVE', 'https://www.linkedin.com/in/timsackett/', '@TimSackett', null, null),
    ('Matthew', 'Shannon', 'mashannon@deloitte.com', 'Deloitte', 'Principal', 'Deloitte 2024 HR Technology Trend Predictions', 'Analyst', 'HIGH', 'GOOD', 'HR Technology Trends', 'ACTIVE', 'https://www.linkedin.com/in/shannomsha/', '@literesearch', null, null),
    ('Brian', 'Sommer', 'brian@techventive.com', 'TechVentive', 'Founder', 'Founder of TechVentive; contributor at diginomica', 'Analyst', 'HIGH', 'GOOD', 'Enterprise Software, HR Tech', 'ACTIVE', 'https://www.linkedin.com/in/brianssommer/', '@BrianSSommer', null, null),
    ('John', 'Sumser', 'john@johnsumser.com', 'HRExaminer', 'Principal Analyst', 'HRExaminer principal analyst and thought leader', 'Analyst', 'HIGH', 'GOOD', 'HR Technology Intelligence', 'ACTIVE', 'https://www.linkedin.com/in/johnsumser/', null, null, null),
    ('Pete', 'Tiliakos', 'pete.tiliakos@nelson-hall.com', 'NelsonHall', 'Research Director', 'NelsonHall Next Generation HCM Technology vendor assessment reports', 'Analyst', 'HIGH', 'GOOD', 'HCM Technology Assessment', 'ACTIVE', 'https://www.linkedin.com/in/petetiliakos/', '@PeteTiliakos', null, null),
    ('William', 'Tincup', 'william@tincup.com', 'RecruitingDaily', 'Principal', 'RecruitingDaily podcasts: The William Tincup Experience, Use Case Podcast', 'Analyst', 'HIGH', 'GOOD', 'Recruiting Technology, HR Tech', 'ACTIVE', 'https://www.linkedin.com/in/tincup/', '@williamtincup', null, null),
    ('Bonnie', 'Tinder', 'Bonnietinder@ravenintel.com', 'Raven Intelligence', 'Principal Analyst', 'Raven Intelligence customer satisfaction and implementation benchmarking reports', 'Analyst', 'HIGH', 'GOOD', 'Implementation Benchmarking', 'ACTIVE', 'https://www.linkedin.com/in/bonnietinder/', '@btinder', null, null),
    ('David', 'Wentworth', 'david.wentworth@brandonhall.com', 'Brandon Hall Group', 'Senior Analyst', 'Brandon Hall Group reports including Why a Learning Content Strategy is Essential', 'Analyst', 'HIGH', 'GOOD', 'Learning Strategy, Content', 'ACTIVE', 'https://www.linkedin.com/in/david-wentworth-51227a7/', '@DavidMWentworth', null, null),
    ('Rebecca', 'Wetterman', 'rebecca@valoir.com', 'Valoir', 'Principal Analyst', 'Valoir reports including The State of Digital Transformation and Is HR Ready for AI?', 'Analyst', 'HIGH', 'GOOD', 'Digital Transformation, AI', 'ACTIVE', 'https://www.linkedin.com/in/rebecca-wettemann-1362b/', '@rebeccawetteman', null, null),
    
    -- Press contacts
    ('Chip', 'Cutter', 'chip.cutter@wsj.com', 'Wall Street Journal', 'Reporter', 'Wall Street Journal workplace reporter', 'Press', 'MEDIUM', 'GOOD', 'Workplace Trends, Business News', 'ACTIVE', 'https://www.linkedin.com/in/chipcutter/', null, null, null),
    ('David', 'Essex', 'dessex@techtarget.com', 'TechTarget', 'Editor', 'TechTarget HR technology editor', 'Press', 'MEDIUM', 'GOOD', 'HR Technology News', 'ACTIVE', 'https://www.linkedin.com/in/david-essex-11300812/', null, null, null),
    ('Bill', 'Kutik', 'bkutik@earthlink.net', 'HR Executive', 'Columnist', 'HR Executive technology columnist', 'Press', 'MEDIUM', 'GOOD', 'HR Technology Commentary', 'ACTIVE', 'https://www.linkedin.com/in/billkutik', null, null, null),
    ('Patrick', 'Thibodeau', 'pthibodeau@techtarget.com', 'TechTarget', 'Senior Writer', 'TechTarget: The human problem with generative AI in HR', 'Press', 'MEDIUM', 'GOOD', 'Technology and Workforce Impact', 'ACTIVE', 'https://www.linkedin.com/in/patrickthibodeau/', '@pthibodeau11', null, null)
) AS backup_analysts(firstName, lastName, email, company, title, bio, type, influence, relationshipHealth, keyThemes, status, linkedinUrl, twitterHandle, personalWebsite, profileImageUrl)
WHERE backup_analysts.email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL);

-- Report results
SELECT 
    (SELECT COUNT(*) FROM analysts) as total_analysts_now,
    (SELECT COUNT(*) FROM analysts_backup_current) as analysts_before_restore,
    (SELECT COUNT(*) FROM analysts) - (SELECT COUNT(*) FROM analysts_backup_current) as analysts_added,
    'Analyst restoration complete! Top HR analysts from backup added to Supabase!' as status; 