WITH new_values ("tableName","name","fileName","nameField") as (
  values 
('Surveys', 'Surveys', 'surveys', 'title'),
('SurveyQuestions', 'Survey Questions', 'survey_questions', 'label'),
('SurveyQuestionOptions', 'Survey Question Options', 'survey_question_options', 'label'),
('SurveyAnswers', 'Survey Answers', 'survey_answers', 'value'),
('Groups', 'Groups', 'groups', 'title'),
('Organizations', 'Organizations', 'organizations', 'name'),
('Tasks', 'Tasks', 'tasks', 'title'),
('WorflowSteps', 'WorflowSteps', 'worflowSteps', 'title'),
('Products', 'Products', 'products', 'title'),
('UnitOfAnalysis', 'UnitOfAnalysis', 'uoas', 'name'),
('UnitOfAnalysisType', 'UnitOfAnalysisType', 'uoatypes', 'name'),
('UnitOfAnalysisClassType', 'UnitOfAnalysisClassType', 'uoaclasstypes', 'name'),
('UnitOfAnalysisTag', 'UnitOfAnalysisTag', 'uoatags', 'name'),
('Projects', 'projects', 'projects', 'codeName'),
('Discussions', 'Discussions', 'discussions', 'name'),
('Users', 'Users', 'users', 'email'),
('Notifications', 'notifications', 'notifications', 'body'),
('ProductUOA', 'productUoa', 'product_uoa', 'productId')
),
upsert as
( 
    update "Essences" m 
        set "tableName" = nv."tableName",
            "fileName" = nv."fileName",
            "nameField" = nv."nameField"
    FROM new_values nv
    WHERE upper(m."name") = upper(nv."name")
    RETURNING m.*
)
-- select * from upsert
INSERT INTO "Essences" ("tableName","name","fileName","nameField")
SELECT "tableName","name","fileName","nameField"
FROM new_values
WHERE NOT EXISTS (SELECT 1 
                  FROM upsert up 
                  WHERE upper(up."name") = upper(new_values."name"))
