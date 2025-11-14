from transformers import MarianMTModel, MarianTokenizer
from typing import Optional
import langdetect

class TranslationService:
    def __init__(self):
        # Initialize models lazily when needed
        self._en_hi_model = None
        self._hi_en_model = None
        self._en_hi_tokenizer = None
        self._hi_en_tokenizer = None

    def _load_en_hi(self):
        if self._en_hi_model is None:
            model_name = "Helsinki-NLP/opus-mt-en-hi"
            self._en_hi_model = MarianMTModel.from_pretrained(model_name)
            self._en_hi_tokenizer = MarianTokenizer.from_pretrained(model_name)

    def _load_hi_en(self):
        if self._hi_en_model is None:
            model_name = "Helsinki-NLP/opus-mt-hi-en"
            self._hi_en_model = MarianMTModel.from_pretrained(model_name)
            self._hi_en_tokenizer = MarianTokenizer.from_pretrained(model_name)

    def detect_language(self, text: str) -> str:
        """Detect language of text. Returns 'en' for English, 'hi' for Hindi."""
        try:
            detected = langdetect.detect(text)
            return 'hi' if detected == 'hi' else 'en'
        except:
            return 'en'  # Default to English on error

    def translate_to_english(self, text: str) -> str:
        """Translate Hindi text to English."""
        if not text or self.detect_language(text) == 'en':
            return text
        
        self._load_hi_en()
        inputs = self._hi_en_tokenizer(text, return_tensors="pt", padding=True, truncation=True)
        translated = self._hi_en_model.generate(**inputs)
        return self._hi_en_tokenizer.decode(translated[0], skip_special_tokens=True)

    def translate_to_hindi(self, text: str) -> str:
        """Translate English text to Hindi."""
        if not text or self.detect_language(text) == 'hi':
            return text
            
        self._load_en_hi()
        inputs = self._en_hi_tokenizer(text, return_tensors="pt", padding=True, truncation=True)
        translated = self._en_hi_model.generate(**inputs)
        return self._en_hi_tokenizer.decode(translated[0], skip_special_tokens=True)

    def translate(self, text: str, target_lang: str, force: bool = False) -> str:
        """Translate text to target language if needed."""
        if not text:
            return text
            
        current_lang = self.detect_language(text)
        if current_lang == target_lang and not force:
            return text
            
        if target_lang == 'hi':
            return self.translate_to_hindi(text)
        elif target_lang == 'en':
            return self.translate_to_english(text)
        return text  # Default case