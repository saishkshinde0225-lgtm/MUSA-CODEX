from backend.privacy.transformer import transform_for_privacy


def test_direct_identifiers_are_masked():
    text = (
        "Contact me at test@example.com or +91 9876543210. "
        "My roll no is 202312345678."
    )

    result = transform_for_privacy(text)

    assert "[EMAIL]" in result
    assert "[PHONE]" in result
    assert "[STUDENT_ID]" in result
    assert "test@example.com" not in result
    assert "9876543210" not in result
    assert "202312345678" not in result


def test_social_handle_is_masked():
    result = transform_for_privacy("Message me @student123")

    assert "[HANDLE]" in result
    assert "@student123" not in result


def test_repeated_punctuation_is_normalized():
    result = transform_for_privacy("HELP!!! WHY??? This is bad...")

    assert "!!!" not in result
    assert "???" not in result
    assert "..." not in result


def test_capitalization_is_normalized():
    result = transform_for_privacy("PLEASE HELP ME")

    assert result == "please help me"


def test_empty_input():
    assert transform_for_privacy("") == ""


def test_contextual_person_identifier_is_masked():
    result = transform_for_privacy(
        "Professor Amit Sharma keeps calling me to his office."
    )

    assert "amit sharma" not in result
    assert "[PERSON]" in result


def test_contextual_location_identifier_is_masked():
    result = transform_for_privacy(
        "This happened in Room 304 of the boys hostel."
    )

    assert "room 304" not in result
    assert "[LOCATION]" in result


def test_class_division_identifier_is_masked():
    result = transform_for_privacy(
        "I am from TE AIML division A and they keep targeting our class."
    )

    assert "te aiml" not in result
    assert "division a" not in result
    assert "[ACADEMIC_CONTEXT]" in result


def test_punctuation_style_is_removed():
    text_a = "They keep threatening me!!! I am scared..."
    text_b = "They keep threatening me! I am scared."

    result_a = transform_for_privacy(text_a)
    result_b = transform_for_privacy(text_b)

    assert result_a == result_b


def test_capitalization_style_is_removed():
    text_a = "THEY KEEP THREATENING ME"
    text_b = "they keep threatening me"

    result_a = transform_for_privacy(text_a)
    result_b = transform_for_privacy(text_b)

    assert result_a == result_b


def test_whitespace_style_is_removed():
    text_a = "They   keep   threatening   me."
    text_b = "They keep threatening me."

    result_a = transform_for_privacy(text_a)
    result_b = transform_for_privacy(text_b)

    assert result_a == result_b


def test_stylometric_variants_preserve_semantic_content():
    text_a = "THEY KEEP THREATENING ME!!!"
    text_b = "they keep threatening me."

    result_a = transform_for_privacy(text_a)
    result_b = transform_for_privacy(text_b)

    assert result_a == result_b
    assert "threatening" in result_a
    assert "me" in result_a


def test_word_elongation_style_is_removed():
    text_a = "They are soooo threatening me."
    text_b = "They are so threatening me."

    result_a = transform_for_privacy(text_a)
    result_b = transform_for_privacy(text_b)

    assert result_a == result_b


def test_repeated_letter_style_is_removed():
    text_a = "pleeease help me"
    text_b = "please help me"

    result_a = transform_for_privacy(text_a)
    result_b = transform_for_privacy(text_b)

    assert result_a == result_b


def test_word_elongation_preserves_normal_words():
    text = "The committee will assess the complaint."
    result = transform_for_privacy(text)

    assert result == "the committee will assess the complaint."


def test_multilingual_text_is_preserved():
    text = "Mujhe bahut dar lag raha hai."
    result = transform_for_privacy(text)

    assert result == "mujhe bahut dar lag raha hai."


def test_semantic_words_are_not_damaged():
    text = "The student needs immediate assistance."
    result = transform_for_privacy(text)

    assert result == "the student needs immediate assistance."

def test_cross_complaint_punctuation_variants_are_linkage_safe():
    complaint_a = "They keep threatening me!!! I am scared..."
    complaint_b = "They keep threatening me! I am scared."

    result_a = transform_for_privacy(complaint_a)
    result_b = transform_for_privacy(complaint_b)

    assert result_a == result_b


def test_cross_complaint_style_variants_are_linkage_safe():
    complaint_a = "THEY ARE SOOOO THREATENING ME!!!"
    complaint_b = "they are so threatening me."

    result_a = transform_for_privacy(complaint_a)
    result_b = transform_for_privacy(complaint_b)

    assert result_a == result_b


def test_cross_complaint_whitespace_variants_are_linkage_safe():
    complaint_a = "They   keep   threatening   me."
    complaint_b = "They keep threatening me."

    result_a = transform_for_privacy(complaint_a)
    result_b = transform_for_privacy(complaint_b)

    assert result_a == result_b


def test_cross_complaint_identifier_variants_are_masked():
    complaint_a = "Professor Amit Sharma called me in Room 304."
    complaint_b = "Professor Rahul Patil called me in Room 205."

    result_a = transform_for_privacy(complaint_a)
    result_b = transform_for_privacy(complaint_b)

    assert "[PERSON]" in result_a
    assert "[PERSON]" in result_b
    assert "[LOCATION]" in result_a
    assert "[LOCATION]" in result_b

    assert "amit sharma" not in result_a
    assert "rahul patil" not in result_b
    assert "room 304" not in result_a
    assert "room 205" not in result_b