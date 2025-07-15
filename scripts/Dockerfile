FROM jupyter/base-notebook

USER root

RUN apt-get update && apt-get install -y \
    git unzip sudo libglib2.0-0 libgl1-mesa-glx && \
    rm -rf /var/lib/apt/lists/*
    
RUN userdel -r jovyan || true && rm -rf /home/jovyan

RUN useradd -m -s /bin/bash user && \
    echo "user ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

USER user
WORKDIR /home/user

ENV HOME=/home/user \
    CONDA_PKGS_DIRS=/home/user/.conda_pkgs \
    CONDA_NOTICES_DIR=/home/user/.conda_notices

RUN mkdir -p $CONDA_PKGS_DIRS $CONDA_NOTICES_DIR

RUN conda update -n base -c defaults conda -y && \
    conda create -n yolo python=3.12 -y && \
    conda run -n yolo pip install --upgrade pip && \
    conda run -n yolo pip install ultralytics tensorboard jupyterlab

CMD ["bash", "-c", "\
  source /opt/conda/etc/profile.d/conda.sh && \
  conda activate yolo && \
  if [ -z \"$JUPYTER_TOKEN\" ]; then \
    exec jupyter lab --ip=0.0.0.0 --port=8888 --no-browser; \
  else \
    exec jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --ServerApp.token=$JUPYTER_TOKEN; \
  fi"]
