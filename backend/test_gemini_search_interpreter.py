import json
import unittest
from io import BytesIO
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException

import gemini_search_interpreter as search


class SearchRequest:
    headers = {"x-city-options": ""}
    client = SimpleNamespace(host="127.0.0.1")


def provider_response(parsed):
    payload = {"candidates": [{"content": {"parts": [{"text": json.dumps(parsed, ensure_ascii=False)}]}}]}
    return BytesIO(json.dumps(payload).encode("utf-8"))


def parsed_result(tags):
    return {
        "status": "ok",
        "query": "양꼬치",
        "tags": tags,
        "region": "전체",
        "city": "전체",
        "period": "전체",
        "transport": "전체",
        "infant": False,
        "pet": False,
    }


class SearchTagInterpreterTests(unittest.TestCase):
    @patch.object(search.limiter, "admit")
    @patch.object(search, "_settings", return_value=("test-key", "gemini-test"))
    @patch.object(search, "urlopen")
    def test_only_allowlisted_candidates_reach_model_and_response(self, urlopen, _settings, _admit):
        urlopen.return_value.__enter__.return_value = provider_response(["고기구이"])
        body = search.SearchInterpretation(query="양꼬치", candidate_tags=["고기구이", "허용되지 않은 태그"])

        result = search.interpret_search(body, SearchRequest(), x_search_session="s" * 24)

        request_payload = json.loads(urlopen.call_args.args[0].data)
        model_input = json.loads(request_payload["contents"][0]["parts"][0]["text"])
        self.assertEqual(model_input["candidate_app_tags"], ["고기구이"])
        self.assertEqual(request_payload["generationConfig"]["responseSchema"]["properties"]["tags"]["items"]["enum"], ["고기구이"])
        self.assertEqual(result["tags"], ["고기구이"])

    @patch.object(search.limiter, "admit")
    @patch.object(search, "_settings", return_value=("test-key", "gemini-test"))
    @patch.object(search, "urlopen")
    def test_model_cannot_return_tag_outside_shortlist(self, urlopen, _settings, _admit):
        urlopen.return_value.__enter__.return_value = provider_response(["카페"])
        body = search.SearchInterpretation(query="양꼬치", candidate_tags=["고기구이"])

        with self.assertRaises(HTTPException) as error:
            search.interpret_search(body, SearchRequest(), x_search_session="s" * 24)

        self.assertEqual(error.exception.status_code, 502)


if __name__ == "__main__":
    unittest.main()
