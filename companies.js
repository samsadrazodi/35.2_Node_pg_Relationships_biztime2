const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");


router.get('/', async (req,res,next)=>{
    try{
        const results = await db.query(`SELECT * FROM companies`);
        return res.json({companies: results.rows})

    }catch (e){
        return next(e);
    }
})

router.get("/:code", async function (req, res, next) {
    try {
        let code = req.params.code;
  
        const comResult = await db.query(`SELECT code, name, description
                                        FROM companies
                                        WHERE code = $1`,[code]);
  
        const invResult = await db.query(`SELECT id
                                          FROM invoices
                                          WHERE comp_code = $1`,[code]);
        const indResult = await db.query(`SELECT i.industry
                                          FROM companies AS c
                                          LEFT JOIN companies_industries AS ci
                                          ON c.code= ci.company_code
                                          LEFT JOIN industries AS i
                                          ON ci.industry_code= i.code
                                          WHERE company_code =$1`,[code]);
        
  
        if (comResult.rows.length === 0) {
            throw new ExpressError(`No such company: ${code}`, 404)
        }
  
        const company = comResult.rows[0];
        const invoices = invResult.rows;
        const industries = indResult.rows;
  
        company.invoices = invoices.map(inv => inv.id);
        company.industries = industries.map(ind => ind.industry)
        return res.json({"company": company});
        }catch (err) {
            return next(err);
        }
    });


router.post('/',async (req,res,next)=>{
    try{
        const {name, description} = req.body;
        let code = slugify(name, {lower: true});
        const results = await db.query(`INSERT INTO companies(code,name,description) VALUES ($1,$2,$3) RETURNING code, name, description`,[code,name,description]);
        return res.status(201).json({company: results.rows[0]});

    }catch(e){
        return next(e)
    }
})


router.put('/:code', async (req,res,next)=>{
    try{
      const {code} = req.params;
      const {name,description}= req.body;
      const results = await db.query(`UPDATE companies 
                                      SET name=$1, description=$2 
                                      WHERE code=$3 
                                      RETURNING code,name,description`, [name,description,req.params.code]);
      if (results.rows.length===0){
        throw new ExpressError(`Can't update company with code of ${code}`,404)
      }
      return res.send({ company: results.rows[0] })
  
    }catch (e){
      next(e);
    }
  })

router.delete('/:code', async (req,res,next)=>{
    try{
        const {code} = req.params;
        const result = await db.query(`DELETE  
                                      FROM companies
                                      WHERE code = $1 RETURNING code`,[req.params.code]);
        if (result.rows.length===0){
            throw new ExpressError(`Can't delete company with code of ${code}`,404)
        }
        return res.send({status: "deleted"})
  
    }catch(e){
      next(e);
    }
})



module.exports = router;