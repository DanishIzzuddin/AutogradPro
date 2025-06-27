import os
from flask import request
from werkzeug.utils import secure_filename
from backend.config import db, Submission, RouterResult
from backend.grader.grader import grade_all, format_summary

UPLOAD_FOLDER = "uploads"

def init_routes(app):
    app.config.setdefault("UPLOAD_FOLDER", UPLOAD_FOLDER)
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    @app.route("/submit", methods=["POST"])
    def submit():
        # 1) Form data
        name = request.form["student_name"]
        bp   = request.form["birthday_prefix"]

        # 2) Required zips
        m = request.files["master_zip"]
        s = request.files["student_zip"]

        # 3) Optional neighbor zips
        mn_file = request.files.get("master_neigh_zip")
        sn_file = request.files.get("student_neigh_zip")

        # 4) Save config zips
        mfn = secure_filename(m.filename)
        sfn = secure_filename(s.filename)
        mpath = os.path.join(app.config["UPLOAD_FOLDER"], mfn)
        spath = os.path.join(app.config["UPLOAD_FOLDER"], sfn)
        m.save(mpath)
        s.save(spath)

        # 5) Save neighbor or fallback
        if mn_file:
            mnf = secure_filename(mn_file.filename)
            mnpath = os.path.join(app.config["UPLOAD_FOLDER"], mnf)
            mn_file.save(mnpath)
        else:
            mnf, mnpath = mfn, mpath

        if sn_file:
            snf = secure_filename(sn_file.filename)
            snpath = os.path.join(app.config["UPLOAD_FOLDER"], snf)
            sn_file.save(snpath)
        else:
            snf, snpath = sfn, spath

        # 6) Grade
        summary = grade_all(
            master_zip        = mpath,
            student_zip       = spath,
            master_neigh_zip  = mnpath,
            student_neigh_zip = snpath,
            birthday_prefix   = bp,
            master_prefix     = None
        )

        # 7) Persist Submission
        sub = Submission(
            student_name    = name,
            birthday_prefix = bp,
            master_zip      = mfn,
            student_zip     = sfn,
            final_score     = summary["final_score"]
        )
        db.session.add(sub)
        db.session.commit()

        # 8) Persist per-router
        for router, data in summary["per_router"].items():
            rr = RouterResult(
                submission_id = sub.id,
                router_name   = router,
                score         = int(data["score"]),
                feedback      = "\n".join(data["feedback"]),
                diff          = ""
            )
            db.session.add(rr)
        db.session.commit()

        # 9) Return plain-text report
        return format_summary(summary), 200, {"Content-Type": "text/plain"}
