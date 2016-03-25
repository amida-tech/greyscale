WITH new_values ("tableName","name","fileName","nameField") as (
  values 
('Surveys', 'Surveys', 'surveys', 'title'),
('SurveyQuestions', 'Survey Questions', 'survey_questions', 'label'),
('SurveyQuestionOptions', 'Survey Question Options', 'survey_question_options', 'label'),
('SurveyAnswers', 'Survey Answers', 'survey_answers', 'value'),
('AnswerAttachments', 'AnswerAttachments', 'answer_attachments', 'filename'),
('Groups', 'Groups', 'groups', 'title'),
('Organizations', 'Organizations', 'organizations', 'name'),
('Tasks', 'Tasks', 'tasks', 'title'),
('Workflows', 'Workflows', 'workflows', 'name'),
('WorfklowSteps', 'WorkflowSteps', 'workflow_steps', 'title'),
('WorfklowStepGroups', 'WorkflowStepGroups', 'workflow_step_groups', 'stepId'),
('Products', 'Products', 'products', 'title'),
('UnitOfAnalysis', 'UnitOfAnalysis', 'uoas', 'name'),
('UnitOfAnalysisType', 'UnitOfAnalysisType', 'uoatypes', 'name'),
('UnitOfAnalysisClassType', 'UnitOfAnalysisClassType', 'uoaclasstypes', 'name'),
('UnitOfAnalysisTag', 'UnitOfAnalysisTag', 'uoatags', 'name'),
('UnitOfAnalysisTagLink', 'UnitOfAnalysisTagLink', 'uoataglinks', 'id'),
('Projects', 'projects', 'projects', 'codeName'),
('Discussions', 'Discussions', 'discussions', 'name'),
('Users', 'Users', 'users', 'email'),
('Notifications', 'notifications', 'notifications', 'body'),
('ProductUOA', 'productUoa', 'product_uoa', 'productId'),
('Indexes', 'Indexes', 'indexes', 'title'),
('Subindexes', 'Subindexes', 'subindexes', 'title'),
('IndexQuestionWeights', 'IndexQuestionWeights', 'index_question_weights', 'type'),
('IndexSubindexWeights', 'IndexSubindexWeights', 'index_subindex_weights', 'type'),
('SubindexWeights', 'SubindexWeights', 'subindex_weights', 'type'),
('Translations', 'Translations', 'translations', 'field'),
('Roles', 'Roles', 'roles', 'name'),
('Rights', 'Rights', 'rights', 'action'),
('RoleRights', 'RoleRights', 'role_rights', 'roleId'),
('Visualizations', 'Visualizations', 'visualizations', 'title'),
('AccessMatrices', 'AccessMatrices', 'access_matrices', 'name'),
('AccessPermissions', 'AccessPermissions', 'access_permissions', 'id')
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
