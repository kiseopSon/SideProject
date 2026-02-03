# CPU OOM 회피: diffusers가 체크포인트를 CPU에 올리지 않고 GPU로 직접 로드하도록 패치.
# app.py 최상단에서 import (다른 diffusers 사용 전에).

from __future__ import annotations

import os
from typing import List, Optional, Union

import torch
from diffusers.models import modeling_utils as m_utils
from diffusers.models.modeling_utils import (
    WEIGHTS_NAME,
    _add_variant,
)
import safetensors.torch

_orig_load_state_dict = m_utils.load_state_dict
_orig_load_model_dict_into_meta = m_utils.load_model_dict_into_meta


def _load_state_dict(checkpoint_file: Union[str, os.PathLike], variant: Optional[str] = None):
    # CPU에 로드 (GPU 직접 로드는 메모리 부족 위험)
    # 모델 로딩 후 .to(device)로 GPU 이동
    dev = "cpu"
    try:
        if os.path.basename(checkpoint_file) == _add_variant(WEIGHTS_NAME, variant):
            return torch.load(checkpoint_file, map_location=dev)
        return safetensors.torch.load_file(checkpoint_file, device=dev)
    except Exception as e:
        try:
            with open(checkpoint_file) as f:
                if f.read().startswith("version"):
                    raise OSError(
                        "You seem to have cloned a repository without having git-lfs installed. "
                        "Please install git-lfs and run `git lfs install` followed by `git lfs pull`."
                    ) from e
                raise ValueError(
                    f"Unable to locate the file {checkpoint_file} which is necessary to load this "
                    "pretrained model. Make sure you have saved the model properly."
                ) from e
        except (UnicodeDecodeError, ValueError):
            raise OSError(
                f"Unable to load weights from checkpoint file '{checkpoint_file}'."
            ) from e


def _load_model_dict_into_meta(
    model,
    state_dict,
    device: Optional[Union[str, torch.device]] = None,
    dtype=None,
    model_name_or_path: Optional[str] = None,
) -> List[str]:
    # 8GB VRAM: 전부 CPU에 로드 후 enable_model_cpu_offload로 추론 시에만 GPU 사용
    device = "cpu"
    return _orig_load_model_dict_into_meta(
        model, state_dict, device=device, dtype=dtype, model_name_or_path=model_name_or_path
    )


m_utils.load_state_dict = _load_state_dict
m_utils.load_model_dict_into_meta = _load_model_dict_into_meta
