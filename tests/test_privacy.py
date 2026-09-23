from backend.privacy.transformer import transform_for_privacy


def test_direct_identifiers_are_masked():
    text = (
        "Contact me at test@example.com or +91 9876543210. "
        "My roll no is 202312345678."
    )

    result = transform_for_privacy(text)

    assert "[email]" in result
    assert "[phone]" in result
    assert "[student_id]" in result
    assert "test@example.com" not in result
    assert "9876543210" not in result
    assert "202312345678" not in result


def test_social_handle_is_masked():
    result = transform_for_privacy("Message me @student123")

    assert "[handle]" in result
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