import torch
import numpy as np
from PIL import Image
import requests
from io import BytesIO

class PexelsImageSearch:
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {
                "api_key": ("STRING", {"default": ""}),
                "search_query": ("STRING", {"default": "cyberpunk city"}),
                # This holds the URL of whatever thumbnail you click on in the gallery
                "selected_url": ("STRING", {"default": "", "multiline": True}),
            }
        }

    RETURN_TYPES = ("IMAGE", "STRING")
    RETURN_NAMES = ("image", "image_url")
    FUNCTION = "fetch_image"
    CATEGORY = "image/web"

    def fetch_image(self, api_key, search_query, selected_url):
        if not selected_url or selected_url.strip() == "":
            raise ValueError("Please click 'Load Gallery' and select an image thumbnail first.")
            
        try:
            img_response = requests.get(selected_url)
            img_response.raise_for_status()
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Error downloading image from {selected_url}: {e}")
            
        i = Image.open(BytesIO(img_response.content)).convert("RGB")
        image = np.array(i).astype(np.float32) / 255.0
        image = torch.from_numpy(image)[None,]
        
        return (image, selected_url)