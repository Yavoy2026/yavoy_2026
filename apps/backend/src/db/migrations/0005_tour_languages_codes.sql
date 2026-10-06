-- YAV-25: языки экскурсии переезжают со свободных строк на коды (ru/en/uz/de/fr/zh/tt).
-- Неизвестные значения остаются как есть — данные не теряем.
UPDATE tours
SET languages = (
  SELECT jsonb_agg(
    CASE lower(btrim(value))
      WHEN 'русский' THEN 'ru'
      WHEN 'russian' THEN 'ru'
      WHEN 'английский' THEN 'en'
      WHEN 'english' THEN 'en'
      WHEN 'узбекский' THEN 'uz'
      WHEN 'uzbek' THEN 'uz'
      WHEN 'немецкий' THEN 'de'
      WHEN 'deutsch' THEN 'de'
      WHEN 'german' THEN 'de'
      WHEN 'французский' THEN 'fr'
      WHEN 'français' THEN 'fr'
      WHEN 'french' THEN 'fr'
      WHEN 'китайский' THEN 'zh'
      WHEN '中文' THEN 'zh'
      WHEN 'chinese' THEN 'zh'
      WHEN 'татарский' THEN 'tt'
      WHEN 'tatar' THEN 'tt'
      ELSE btrim(value)
    END
  )
  FROM jsonb_array_elements_text(languages) AS value
)
WHERE jsonb_array_length(languages) > 0;
