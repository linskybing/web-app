FROM jupyter/base-notebook

USER root

RUN useradd -m -s /bin/bash user && \
    cp -r /home/jovyan/. /home/user/ && \
    chown -R user:user /home/user && \
    userdel -r jovyan || true

ENV HOME=/home/user
WORKDIR /home/user
USER user

CMD ["sh", "-c", "\
  if [ -z \"$JUPYTER_TOKEN\" ]; then \
    exec jupyter lab --ip=0.0.0.0 --port=8888 --no-browser; \
  else \
    exec jupyter lab --ip=0.0.0.0 --port=8888 --no-browser --NotebookApp.token=$JUPYTER_TOKEN; \
  fi"]
