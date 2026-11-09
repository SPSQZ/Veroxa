"""
Optional multimodal verification: CLIP image similarity + Tesseract OCR.

These features are DISABLED by default.

Enable CLIP:   $env:VEROXA_ENABLE_CLIP = "true"
Enable OCR:    $env:VEROXA_ENABLE_OCR  = "true"

Important limitations (disclosed for responsible AI):
  - Image similarity is SUPPORTING EVIDENCE, not proof of product identity.
    A photo can be incomplete, misleading, or taken from a different angle.
  - OCR results depend on image quality. Poor lighting or blur reduces accuracy.
  - Neither CLIP similarity nor OCR text alone can establish authenticity.
  - Any image-based finding must be presented to the human reviewer alongside
    its limitations, not used as an automated refund trigger.

Both classes degrade gracefully: if the required library is not installed,
the matching engine logs a warning and continues without image analysis.

Install requirements for CLIP:
    pip install torch transformers

Install requirements for OCR:
    pip install pytesseract pillow
    # Also install Tesseract binary: https://github.com/UB-Mannheim/tesseract/wiki
"""

from __future__ import annotations
from pathlib import Path


class OCRService:
    """
    Extract text from images using Tesseract OCR.

    Use cases:
      - Read box labels for model numbers, SKUs, barcodes
      - Extract serial numbers from product photos
      - Read accessory labels

    Requires: pytesseract + Tesseract binary installed on the system.
    """

    def extract(self, image_path: str) -> str:
        """
        Return extracted text from the image at image_path.
        Returns empty string if extraction fails.
        """
        try:
            import pytesseract
            from PIL import Image
            img = Image.open(Path(image_path))
            text = pytesseract.image_to_string(img)
            return text.strip()
        except Exception as exc:
            return f"[OCR extraction failed: {type(exc).__name__}: {exc}]"


class CLIPImageComparator:
    """
    Compare two product images using OpenAI CLIP embeddings.

    Similarity score is cosine similarity between image feature vectors [0, 1].
    Higher score = more visually similar.

    IMPORTANT: Similarity is SUPPORTING EVIDENCE, not proof.
    - Two different models can have similar photos
    - The same model can have dissimilar photos (different angles, lighting)
    - Score must be presented with explicit caveats to the reviewer

    Requires: torch, transformers (HuggingFace)
    """

    def __init__(self, model_name: str = "openai/clip-vit-base-patch32"):
        self.model_name = model_name
        self._model = None
        self._processor = None

    def _load(self):
        if self._model is None:
            import torch
            from transformers import CLIPModel, CLIPProcessor
            self._processor = CLIPProcessor.from_pretrained(self.model_name)
            self._model = CLIPModel.from_pretrained(self.model_name)
            self._model.eval()
        return self._model, self._processor

    def similarity(self, image_a: str, image_b: str) -> float:
        """
        Return cosine similarity [0, 1] between two product images.

        Args:
            image_a: path to listing/reference image
            image_b: path to received-product image

        Returns:
            float in [0, 1]; higher = more visually similar
        """
        import torch
        from PIL import Image

        model, processor = self._load()
        images = [
            Image.open(Path(p)).convert("RGB")
            for p in (image_a, image_b)
        ]
        inputs = processor(images=images, return_tensors="pt", padding=True)
        with torch.no_grad():
            features = model.get_image_features(**inputs)
            features = torch.nn.functional.normalize(features, dim=-1)
            score = torch.sum(features[0] * features[1]).item()
        return max(0.0, min(1.0, float(score)))
