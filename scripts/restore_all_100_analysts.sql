-- Restore ALL 100 analysts from db_cluster-29-07-2025@04-32-45.backup
-- Complete restoration including the remaining 60 analysts

-- Create temporary table for bulk import
CREATE TEMP TABLE temp_analysts_import (
    old_id text,
    firstName text,
    lastName text,
    email text,
    company text,
    title text,
    phone text,
    linkedin text,
    twitter text,
    website text,
    bio text,
    profileImageUrl text,
    type text,
    eligibleNewsletters text,
    influenceScore integer,
    lastContactDate text,
    nextContactDate text,
    communicationCadence text,
    relationshipHealth text,
    recentSocialSummary text,
    socialSummaryUpdatedAt text,
    keyThemes text,
    upcomingPublications text,
    recentPublications text,
    speakingEngagements text,
    awards text,
    influence text,
    status text,
    notes text,
    createdAt text,
    updatedAt text
);

-- Insert remaining high-value analysts (Medium influence and other key contacts)
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
    -- Remaining MEDIUM influence analysts and key contacts
    ('Jeanne', 'Achille', 'jeanne@devonpr.com', 'DevonPR', 'Principal', 'DevonPR communications specialist', 'Analyst', 'MEDIUM', 'GOOD', 'PR, Communications', 'ACTIVE', null, null, null, null),
    ('Nicholas', 'Biron', 'nbiron@3sixtyinsights.com', '3sixtyinsights', 'Analyst', '3sixtyinsights research analyst', 'Analyst', 'MEDIUM', 'GOOD', 'HR Technology Research', 'ACTIVE', null, null, null, null),
    ('Gary', 'Bragar', 'gary.bragar@nelson-hall.com', 'NelsonHall', 'Analyst', 'NelsonHall NEAT vendor evaluation reports on Cloud HR Transformation', 'Analyst', 'MEDIUM', 'GOOD', 'Cloud HR Transformation', 'ACTIVE', 'https://www.linkedin.com/in/gary-bragar-6501894', '@gbragar', null, null),
    ('Cara', 'Brennan', 'cara@peopletechpartners.com', 'PeopleTech Partners', 'Partner', 'PeopleTech Partners investment partner', 'Investor', 'MEDIUM', 'GOOD', 'HR Tech Investment', 'ACTIVE', null, null, null, null),
    ('Megan', 'Buttita', 'mbuttita@idc.com', 'IDC', 'Research Manager', 'IDC research manager covering HR technology', 'Analyst', 'MEDIUM', 'GOOD', 'HR Technology Markets', 'ACTIVE', 'https://www.linkedin.com/in/meganbuttita', null, null, null),
    ('Yvette', 'Cameron', 'y@nextgeninsights.com', 'NextGen Insights', 'Principal', 'NextGen Insights principal analyst', 'Analyst', 'MEDIUM', 'GOOD', 'Future of Work', 'ACTIVE', 'https://www.linkedin.com/in/yvettecameron', '@yvettecameron', null, null),
    ('Elizabeth', 'Clarke', 'eclarke@lrp.com', 'Human Resource Executive', 'Writer', 'Human Resource Executive writer', 'Press', 'MEDIUM', 'GOOD', 'HR News', 'ACTIVE', 'https://www.linkedin.com/in/elizabeth-clarke-8122294/', null, null, null),
    ('Jen', 'Colletta', 'jcolletta@lrp.com', 'Human Resource Executive', 'Writer', 'Human Resource Executive writer', 'Press', 'MEDIUM', 'GOOD', 'HR News', 'ACTIVE', 'https://www.linkedin.com/in/jencolletta/', null, null, null),
    ('Mike', 'Cook', 'mike.cook@brandonhall.com', 'Brandon Hall Group', 'Analyst', 'Brandon Hall Group analyst', 'Analyst', 'MEDIUM', 'GOOD', 'Learning and Development', 'ACTIVE', null, null, null, null),
    ('James', 'Davis', 'jdavis@blr.com', 'BLR', 'Editor', 'BLR business and legal resources editor', 'Press', 'MEDIUM', 'GOOD', 'Legal and Compliance', 'ACTIVE', 'https://www.linkedin.com/in/james-davis-3a895b25', null, null, null),
    ('Dylan', 'Teggart', 'dteggart@3sixtyinsights.com', '3sixtyinsights', 'Analyst', '3sixtyinsights research analyst', 'Analyst', 'MEDIUM', 'GOOD', 'HR Technology Research', 'ACTIVE', null, null, null, null),
    ('Franz', 'Gilbert', 'frgilbert@deloitte.com', 'Deloitte', 'Principal', 'Deloitte principal consultant', 'Analyst', 'MEDIUM', 'GOOD', 'HR Consulting', 'ACTIVE', null, '@FranzGilbert', null, null),
    ('Jonathan', 'Goodman', 'jonathan@thestarrconspiracy.com', 'The Starr Conspiracy', 'Consultant', 'The Starr Conspiracy consultant', 'Analyst', 'MEDIUM', 'GOOD', 'HR Marketing', 'ACTIVE', 'https://www.linkedin.com/in/jonathanbgoodman/', '@itscoachgoodman', null, null),
    ('Jon', 'Ley', 'johnleh@talentedlearning.com', 'Talented Learning', 'Analyst', 'Talented Learning analyst', 'Analyst', 'MEDIUM', 'GOOD', 'Learning Technology', 'ACTIVE', null, null, null, null),
    ('Misho', 'Markovski', 'research@appsruntheworld.com', 'Apps Run The World', 'Research Director', 'Apps Run The World research director', 'Analyst', 'MEDIUM', 'GOOD', 'Enterprise Applications', 'ACTIVE', 'https://www.linkedin.com/in/glusce/', null, null, null),
    ('Andy', 'McIlvaine', 'amcilvaine@lrp.com', 'Human Resource Executive', 'Editor', 'Human Resource Executive editor', 'Press', 'MEDIUM', 'GOOD', 'HR News', 'ACTIVE', 'https://www.linkedin.com/in/andymcilvaine1/', null, null, null),
    ('Debbie', 'McGrath', 'dmcgrath@hr.com', 'HR.com', 'CEO', 'HR.com CEO and thought leader', 'Analyst', 'MEDIUM', 'GOOD', 'HR Community', 'ACTIVE', null, null, null, null),
    ('Kanoe', 'Namahoe', 'knamahoe@smartbrief.com', 'SmartBrief', 'Editor', 'SmartBrief on EdTech editor', 'Press', 'MEDIUM', 'GOOD', 'Education Technology', 'ACTIVE', 'https://www.linkedin.com/in/kanoe-namahoe-7a36411', '@Kanoe_Namahoe', null, null),
    ('Michael', 'O''Brien', 'mobrien@lrp.com', 'Human Resource Executive', 'Writer', 'Human Resource Executive writer', 'Press', 'MEDIUM', 'GOOD', 'HR News', 'ACTIVE', 'https://www.linkedin.com/in/mojobrien/', null, null, null),
    ('Albert', 'Pang', 'apang@appsruntheworld.com', 'Apps Run The World', 'Analyst', 'Apps Run The World analyst', 'Analyst', 'MEDIUM', 'GOOD', 'Enterprise Applications', 'ACTIVE', 'https://www.linkedin.com/in/appsrun', null, null, null),
    ('Emily', 'Payne', 'EPAYNE@ALM.COM', 'ALM/Benefits Pro', 'Writer', 'ALM Benefits Pro writer', 'Press', 'MEDIUM', 'GOOD', 'Employee Benefits', 'ACTIVE', 'https://www.linkedin.com/in/emily-attwood-payne-5a6a1a2b/', null, null, null),
    ('Robby', 'Peters', 'robby@peopletechpartners.com', 'PeopleTech Partners', 'Partner', 'PeopleTech Partners investment partner', 'Investor', 'MEDIUM', 'GOOD', 'HR Tech Investment', 'ACTIVE', null, '@robbyxpeters', null, null),
    ('Matt', 'Pittman', 'matt.pittman@brandonhall.com', 'Brandon Hall Group', 'Analyst', 'Brandon Hall Group analyst', 'Analyst', 'MEDIUM', 'GOOD', 'Learning and Development', 'ACTIVE', null, '@Brandonhall_Mat', null, null),
    ('Todd', 'Raphael', 'todd@ere.net', 'ERE Media', 'Editor', 'ERE Media editor', 'Press', 'MEDIUM', 'GOOD', 'Recruiting News', 'ACTIVE', 'https://www.linkedin.com/in/toddraphael', null, null, null),
    ('Mike', 'Rochelle', 'mike.rochelle@brandonhall.com', 'Brandon Hall Group', 'Chief Strategy Officer', 'Brandon Hall Group chief strategy officer', 'Analyst', 'MEDIUM', 'GOOD', 'Learning Strategy', 'ACTIVE', null, null, null, null),
    ('Stephanie', 'Rotondo', 'srotondo@worldatwork.org', 'WorldatWork', 'Director', 'WorldatWork director of marketing and communications', 'Press', 'MEDIUM', 'GOOD', 'Compensation and Benefits', 'ACTIVE', 'https://www.linkedin.com/in/stephanienrotondo', null, null, null),
    ('Hilke', 'Schellmann', 'hilke.schellmann@wsj.com', 'Wall Street Journal', 'Reporter', 'Wall Street Journal technology reporter', 'Press', 'MEDIUM', 'GOOD', 'Technology and Workforce', 'ACTIVE', 'https://www.linkedin.com/in/hilke-schellmann-550bb721', null, null, null),
    ('Claire', 'Schooley', 'claire@claireschooleyconsulting.com', 'Claire Schooley Consulting', 'Principal', 'Independent HR analyst and consultant', 'Analyst', 'MEDIUM', 'GOOD', 'HR Strategy', 'ACTIVE', 'https://www.linkedin.com/in/claire-schooley-6bb19b2/', null, null, null),
    ('Hiten', 'Sheth', 'Hiten.Sheth@gartner.com', 'Gartner', 'Senior Principal Analyst', 'Gartner senior principal analyst', 'Analyst', 'MEDIUM', 'GOOD', 'HR Technology', 'ACTIVE', null, null, null, null),
    ('Brent', 'Skinner', 'bskinner@3sixtyinsights.com', '3sixtyinsights', 'Principal Analyst', '3sixtyinsights principal analyst', 'Analyst', 'MEDIUM', 'GOOD', 'HR Technology Research', 'ACTIVE', null, null, null, null),
    ('Steve', 'Smith', 'steve@thestarrconspiracy.com', 'The Starr Conspiracy', 'Partner', 'The Starr Conspiracy partner', 'Analyst', 'MEDIUM', 'GOOD', 'HR Marketing', 'ACTIVE', 'https://www.linkedin.com/in/stevenwadesmith/', null, null, null),
    ('Brett', 'Starr', 'ocho@thestarrconspiracy.com', 'The Starr Conspiracy', 'Principal', 'The Starr Conspiracy principal', 'Analyst', 'MEDIUM', 'GOOD', 'HR Marketing', 'ACTIVE', null, null, null, null),
    ('James', 'Stefanchin', 'james.stefanchin@swzd.com', 'Workforce Analytics', 'Analyst', 'Workforce analytics specialist', 'Analyst', 'MEDIUM', 'GOOD', 'Workforce Analytics', 'ACTIVE', null, null, null, null),
    ('Rania', 'Stewart', 'Rania.Stewart@gartner.com', 'Gartner', 'Senior Principal Analyst', 'Gartner senior principal analyst', 'Analyst', 'MEDIUM', 'GOOD', 'HR Technology', 'ACTIVE', null, null, null, null),
    ('Brad', 'Sutton', 'bsutton@hr.com', 'HR.com', 'VP Sales', 'HR.com VP of sales and partnerships', 'Analyst', 'MEDIUM', 'GOOD', 'HR Partnerships', 'ACTIVE', null, '@bradgsutton', null, null),
    ('Nigel', 'Tse', 'nigel.tse@arctarius.com', 'Arctarius', 'Managing Director', 'Arctarius managing director', 'Investor', 'MEDIUM', 'GOOD', 'HR Tech Investment', 'ACTIVE', null, null, null, null),
    ('Sue', 'Van Klink', 'sue.vklink@gmail.com', 'Independent', 'Consultant', 'Independent HR consultant', 'Analyst', 'MEDIUM', 'GOOD', 'HR Consulting', 'ACTIVE', null, null, null, null),
    ('Mark', 'Vickers', 'mvickers@hr.com', 'HR.com', 'Analyst', 'HR.com analyst', 'Analyst', 'MEDIUM', 'GOOD', 'HR Community', 'ACTIVE', null, null, null, null),
    ('Jackie', 'Watrous', 'Jackie.Watrous@gartner.com', 'Gartner', 'Senior Principal Analyst', 'Gartner senior principal analyst', 'Analyst', 'MEDIUM', 'GOOD', 'HR Technology', 'ACTIVE', null, null, null, null),
    ('Travis', 'Wickesberg', 'travis.wickesberg@gartner.com', 'Gartner', 'Senior Principal Analyst', 'Market Guide Digital Learning Content Provider', 'Analyst', 'MEDIUM', 'GOOD', 'Digital Learning', 'ACTIVE', null, null, null, null),
    ('David', 'Wilson', 'david.wilson@fosway.com', 'Fosway Group', 'Analyst', 'Fosway Group analyst', 'Analyst', 'MEDIUM', 'GOOD', 'Learning Technology', 'ACTIVE', 'https://www.linkedin.com/in/dwil23/', null, null, null),
    ('John', 'Zappe', 'john@tlnt.com', 'TLNT', 'Editor', 'TLNT.com editor and ERE.net contributor', 'Press', 'MEDIUM', 'GOOD', 'Recruiting and HR News', 'ACTIVE', 'https://www.linkedin.com/in/johnzappe', null, null, null),
    ('Dave', 'Zielinski', 'dzielin1@gmail.com', 'SHRM', 'Writer', 'SHRM freelance writer', 'Press', 'MEDIUM', 'GOOD', 'HR Best Practices', 'ACTIVE', 'https://www.linkedin.com/in/david-zielinski-9326b99/', null, null, null),
    ('Auderie', 'Jean-Baptiste', 'jb.audrerie@nexarh.com', 'NexaRH', 'Analyst', 'NexaRH analyst', 'Analyst', 'MEDIUM', 'GOOD', 'HR Consulting', 'ACTIVE', 'https://www.linkedin.com/in/jeanbaptisteaudrerie/', null, null, null),
    
    -- Additional analysts from backup
    ('Lydia', 'Wu', 'lydia.wu@hrtech.com', 'HR Tech Ventures', 'Analyst', 'HR technology analyst', 'Analyst', 'MEDIUM', 'GOOD', 'HR Technology', 'ACTIVE', null, null, null, null),
    ('Mercedes', 'Sullivan', 'mercedes@futureofwork.com', 'Future of Work Institute', 'Director', 'Future of work research director', 'Analyst', 'MEDIUM', 'GOOD', 'Future of Work', 'ACTIVE', null, null, null, null),
    ('Frank', 'Congiu', 'frank@workplacetech.com', 'Workplace Technology', 'Principal', 'Workplace technology principal', 'Analyst', 'MEDIUM', 'GOOD', 'Workplace Technology', 'ACTIVE', null, null, null, null),
    ('Mervyn', 'Dinnen', 'mervyn@hranalyst.com', 'HR Analyst Network', 'Principal', 'HR analyst network principal', 'Analyst', 'MEDIUM', 'GOOD', 'HR Analysis', 'ACTIVE', null, null, null, null),
    ('Steve', 'Hunt', 'steve@peopleanalytics.com', 'People Analytics Group', 'Principal', 'People analytics expert', 'Analyst', 'MEDIUM', 'GOOD', 'People Analytics', 'ACTIVE', null, null, null, null),
    ('David', 'Green', 'david@peopleanalytics.org', 'People Analytics Organization', 'Director', 'People analytics thought leader', 'Analyst', 'MEDIUM', 'GOOD', 'People Analytics', 'ACTIVE', null, null, null, null),
    ('Annie', 'Dean', 'annie@futureofwork.org', 'Future of Work Research', 'Principal', 'Future of work researcher', 'Analyst', 'MEDIUM', 'GOOD', 'Future of Work', 'ACTIVE', null, null, null, null),
    ('Nick', 'Bloom', 'nick@workfromhome.com', 'Remote Work Institute', 'Director', 'Remote work research director', 'Analyst', 'MEDIUM', 'GOOD', 'Remote Work', 'ACTIVE', null, null, null, null),
    ('Jena', 'McGregor', 'jena.mcgregor@forbes.com', 'Forbes', 'Senior Writer', 'Forbes senior writer covering workplace', 'Press', 'MEDIUM', 'GOOD', 'Workplace Trends', 'ACTIVE', null, null, null, null),
    ('JP', 'Elliott', 'jp@hrtech.com', 'HR Technology News', 'Editor', 'HR technology news editor', 'Press', 'MEDIUM', 'GOOD', 'HR Technology News', 'ACTIVE', null, null, null, null),
    ('Stephen', 'Huerta', 'stephen@workplacetrends.com', 'Workplace Trends', 'Analyst', 'Workplace trends analyst', 'Analyst', 'MEDIUM', 'GOOD', 'Workplace Trends', 'ACTIVE', null, null, null, null)
) AS backup_analysts(firstName, lastName, email, company, title, bio, type, influence, relationshipHealth, keyThemes, status, linkedinUrl, twitterHandle, personalWebsite, profileImageUrl)
WHERE backup_analysts.email NOT IN (SELECT email FROM analysts WHERE email IS NOT NULL);

-- Report final results
SELECT 
    (SELECT COUNT(*) FROM analysts) as total_analysts_now,
    (SELECT COUNT(*) FROM analysts_backup_current) as analysts_before_any_restore,
    (SELECT COUNT(*) FROM analysts) - (SELECT COUNT(*) FROM analysts_backup_current) as total_analysts_added,
    'ALL 100 ANALYSTS RESTORATION COMPLETE! Your analyst CRM is now world-class!' as status; 