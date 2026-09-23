from backend import main


def test_complaint_pipeline_masks_identifiers_before_normalization(monkeypatch):
    captured = {}

    def fake_normalize_text(text):
        captured["normalized_input"] = text
        return text

    def fake_analyze_text(text):
        captured["model_input"] = text
        return {
            "emotion": "fear",
            "confidence": 0.9,
            "model": "MuRIL",
        }

    monkeypatch.setattr(main, "normalize_text", fake_normalize_text)
    monkeypatch.setattr(main, "analyze_text", fake_analyze_text)

    request = main.ComplaintRequest(
        text=(
            "Professor Amit Sharma ne mujhe akele "
            "office mein bulaya, mujhe dar lag raha hai"
        )
    )

    main.analyze_complaint(request)

    assert "[PERSON]" in captured["normalized_input"]
    assert "amit sharma" not in captured["normalized_input"]

    assert "[PERSON]" in captured["model_input"]
    assert "amit sharma" not in captured["model_input"]